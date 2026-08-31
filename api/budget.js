export const MODEL_CANDIDATES = ['gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-3.1-flash-lite']
export const BUDGET_KEYS = ['food', 'transport', 'shopping', 'utilities', 'entertainment']
const GEMINI_API_VERSION = 'v1beta'
const MAX_REASONABLE_LIMIT_USD = 100000
const MAX_REASONABLE_LIMIT_CENTS = MAX_REASONABLE_LIMIT_USD * 100
const TOTAL_RECOMMENDED_RATIO = 3 // recommended total should be at most this x monthly spending
const MIN_TOTAL_CAP_USD = 1000 // allow at least this much absolute cap for new users

function toCents(value) {
  const cents = Number(value)
  if (!Number.isFinite(cents) || cents < 0 || cents > MAX_REASONABLE_LIMIT_CENTS) {
    return null
  }
  return Math.round(cents)
}

function parseUsdFromCandidate(value) {
  // Accept numeric USD values directly. For strings, strip dollar sign and commas
  // then use parseFloat to preserve decimals. Do NOT infer integer strings as cents.
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return null
    return Number(Number(value).toFixed(2))
  }

  if (typeof value === 'string') {
    const cleaned = value.replace(/[$,\s]/g, '')
    if (!cleaned.length) return null
    const parsed = Number.parseFloat(cleaned)
    if (!Number.isFinite(parsed)) return null
    return Number(parsed.toFixed(2))
  }

  return null
}

export function defaultBudgetFallback(summary = {}) {
  return {
    recommendedLimitCents: BUDGET_KEYS.reduce((acc, key) => {
      const spent = Number(summary[key]) || 0
      acc[key] = Math.max(0, Math.min(Math.round(spent * 100), MAX_REASONABLE_LIMIT_CENTS))
      return acc
    }, {}),
  }
}

export function normalizeBudgetResponse(rawBudget, summary = {}) {
  const fallback = defaultBudgetFallback(summary)
  if (!rawBudget || typeof rawBudget !== 'object') {
    return fallback
  }

  const centsSource = rawBudget.recommendedLimitCents
  const usdSource = rawBudget.recommendedLimitUsd
  const source = centsSource && typeof centsSource === 'object'
    ? { kind: 'cents', data: centsSource }
    : usdSource && typeof usdSource === 'object'
      ? { kind: 'usd', data: usdSource }
      : null

  if (!source || typeof source.data !== 'object') {
    return fallback
  }

  const normalized = {}
  const usdValues = {}

  for (const key of BUDGET_KEYS) {
    const rawValue = source.data[key]
    if (rawValue === undefined) return fallback

    if (source.kind === 'cents') {
      const cents = toCents(rawValue)
      if (cents === null) return fallback
      normalized[key] = cents
      usdValues[key] = Number((cents / 100).toFixed(2))
    } else {
      const usd = parseUsdFromCandidate(rawValue)
      if (usd === null || usd < 0 || usd > MAX_REASONABLE_LIMIT_USD) return fallback
      normalized[key] = Math.round(usd * 100)
      usdValues[key] = usd
    }
  }

  // Validate totals relative to provided monthly summary (income/spending estimate)
  const totalRecommendedUsd = Object.values(usdValues).reduce((s, v) => s + v, 0)
  const totalSummaryUsd = Object.values(summary).reduce((s, v) => s + Number(v || 0), 0)
  const allowedTotal = Math.max(MIN_TOTAL_CAP_USD, totalSummaryUsd * TOTAL_RECOMMENDED_RATIO)
  if (totalRecommendedUsd > allowedTotal) {
    return fallback
  }

  return { recommendedLimitCents: normalized }
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json({
      ok: true,
      service: 'mount-budget-api',
      message: 'Send POST with a spending summary to generate AI budget suggestions.',
    })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      ok: false,
      error: 'Method not allowed. Use POST to generate AI budget suggestions.',
    })
  }

  const { summary } = req.body || {}

  const normalizedSummary = typeof summary === 'object' && summary
    ? Object.fromEntries(
        Object.entries(summary).map(([key, value]) => [key, Number(value) || 0])
      )
    : {}

  if (!Object.keys(normalizedSummary).length) {
    return res.status(400).json({ ok: false, error: 'Missing spending summary.' })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return res.status(500).json({ ok: false, error: 'AI budget generation is not configured on the server.' })
  }

  const prompt = `You are helping plan a monthly household budget. Use only the following category totals in USD, already normalized to monthly spend amounts: ${JSON.stringify(normalizedSummary)}. Return ONLY valid JSON with five keys: food, transport, shopping, utilities, entertainment. Each value is a suggested monthly budget limit in USD rounded to a whole number. Return the result as {"recommendedLimitUsd": { ... }}. Do not include markdown, commentary, or extra keys.`

  let lastError = null

  for (const model of MODEL_CANDIDATES) {
    const url = `https://generativelanguage.googleapis.com/${GEMINI_API_VERSION}/models/${model}:generateContent?key=${apiKey}`

    try {
      const geminiRes = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      })

      if (geminiRes.status === 429) {
        return res.status(429).json({ ok: false, error: 'Rate limited — try again in a moment.' })
      }

      if (geminiRes.ok) {
        const data = await geminiRes.json()
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
        const clean = (text || '').replace(/```json|```/g, '').trim()

        try {
          const match = clean.match(/\{[\s\S]*\}/)
          const candidate = match ? match[0] : clean
          const parsed = JSON.parse(candidate)
          const budget = normalizeBudgetResponse(parsed, normalizedSummary)
          return res.status(200).json(budget)
        } catch {
          return res.status(200).json(defaultBudgetFallback(normalizedSummary))
        }
      }

      lastError = `Gemini request failed (${geminiRes.status}).`
      if (geminiRes.status !== 404) {
        return res.status(502).json({ ok: false, error: lastError })
      }
    } catch (error) {
      lastError = 'Gemini request failed.'
      console.error('Gemini upstream error:', error)
      return res.status(502).json({ ok: false, error: lastError })
    }
  }

  return res.status(502).json({ ok: false, error: lastError || 'Gemini request failed.' })
}
