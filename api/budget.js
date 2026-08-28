export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { summary } = req.body || {}

  const normalizedSummary = typeof summary === 'object' && summary
    ? Object.fromEntries(
        Object.entries(summary).map(([key, value]) => [key, Number(value) || 0])
      )
    : {}

  if (!Object.keys(normalizedSummary).length) {
    return res.status(400).json({ error: 'Missing spending summary' })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'AI budget generation is not configured on the server.' })
  }

  const prompt = `You are helping plan a monthly household budget. Use only the following category totals in USD, already normalized to monthly spend amounts: ${JSON.stringify(normalizedSummary)}. Return ONLY valid JSON with five keys: food, transport, shopping, utilities, entertainment. Each value is a suggested monthly budget limit in USD rounded to a whole number. Do not include markdown, commentary, or extra keys.`

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`

  const geminiRes = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  })

  if (geminiRes.status === 429) {
    return res.status(429).json({ error: 'Rate limited — try again in a moment.' })
  }
  if (!geminiRes.ok) {
    return res.status(502).json({ error: `Gemini request failed (${geminiRes.status}).` })
  }

  const data = await geminiRes.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  const clean = text.replace(/```json|```/g, '').trim()

  try {
    const budget = JSON.parse(clean)
    return res.status(200).json(budget)
  } catch {
    return res.status(502).json({ error: 'Failed to parse Gemini response.' })
  }
}
