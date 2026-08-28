export const MODEL_CANDIDATES = ['gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-3.1-flash-lite']
const GEMINI_API_VERSION = 'v1beta'

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
        const clean = text.replace(/```json|```/g, '').trim()

        try {
          const budget = JSON.parse(clean)
          return res.status(200).json(budget)
        } catch {
          return res.status(502).json({ ok: false, error: 'Failed to parse Gemini response.' })
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
