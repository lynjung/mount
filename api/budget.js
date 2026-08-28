export const MODEL_CANDIDATES = ['gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-3.1-flash-lite']
export const BUDGET_KEYS = ['food', 'transport', 'shopping', 'utilities', 'entertainment']
const GEMINI_API_VERSION = 'v1beta'
const MAX_REASONABLE_LIMIT = 100000

function toRoundedNumber(value) {
  return Number(Number(value).toFixed(2))
}

export function sanitizeBudgetValue(value) {
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || value < 0 || value > MAX_REASONABLE_LIMIT) return null
    return toRoundedNumber(value)
  }

  if (typeof value !== 'string') return null

  const trimmed = value.trim()
  if (!trimmed) return null

  const cleaned = trimmed
    .replace(/[$€£¥]/g, '')
    .replace(/,/g, '')
    .replace(/\s+/g, '')

  if (!/^-?(?:\d+|\d*\.\d+)$/.test(cleaned)) return null

  const parsed = Number(cleaned)
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > MAX_REASONABLE_LIMIT) return null

  return toRoundedNumber(parsed)
}

export function buildDeterministicFallback(summary = {}) {
  return BUDGET_KEYS.reduce((acc, key) => {
    const spent = Number(summary[key]) || 0
    acc[key] = toRoundedNumber(Math.max(0, Math.min(spent, MAX_REASONABLE_LIMIT)))
    return acc
  }, {})
}

export function normalizeBudgetObject(rawBudget, summary = {}) {
  const fallback = buildDeterministicFallback(summary)
  if (!rawBudget || typeof rawBudget !== 'object') {
    return fallback
  }

  const monthlyTotal = Object.values(summary).reduce((sum, value) => sum + (Number(value) || 0), 0)
  const incomeEstimate = Math.max(1000, monthlyTotal * 1.5)

  return BUDGET_KEYS.reduce((acc, key) => {
    const rawValue = rawBudget[key]
    const sanitized = sanitizeBudgetValue(rawValue)
    const spent = Number(summary[key]) || 0
    const maxAllowed = Math.min(
      MAX_REASONABLE_LIMIT,
      Math.max(500, spent * 5, Math.max(0, incomeEstimate * 0.75) / BUDGET_KEYS.length)
    )

    const isValid = sanitized !== null && Number.isFinite(sanitized) && sanitized >= 0 && sanitized <= maxAllowed

    acc[key] = isValid ? toRoundedNumber(sanitized) : fallback[key]
    return acc
  }, {})
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

  const prompt = `You are helping plan a monthly household budget. Use only the following category totals in USD, already normalized to monthly spend amounts: ${JSON.stringify(normalizedSummary)}. Return ONLY valid JSON with five keys: food, transport, shopping, utilities, entertainment. Each value is a suggested monthly budget limit in USD rounded to a whole number. Do not include markdown, commentary, or extra keys.`

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
          const budget = normalizeBudgetObject(parsed, normalizedSummary)
          return res.status(200).json(budget)
        } catch {
          return res.status(200).json(buildDeterministicFallback(normalizedSummary))
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
