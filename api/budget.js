export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { transactions } = req.body
  if (!transactions) {
    return res.status(400).json({ error: 'Missing transactions' })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'Gemini API key not configured' })
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`

  const geminiRes = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `Based on these transactions this month: ${JSON.stringify(transactions)}
Return ONLY valid JSON, no markdown formatting, no code fences, no explanation:
{ "food": number, "transport": number, "shopping": number, "utilities": number, "entertainment": number }
All values are suggested monthly budget limits in USD.`
        }]
      }]
    })
  })

  if (geminiRes.status === 429) {
    return res.status(429).json({ error: 'Rate limited — try again in a moment.' })
  }
  if (!geminiRes.ok) {
    return res.status(502).json({ error: `Gemini error: ${geminiRes.status}` })
  }

  const data = await geminiRes.json()
  const text = data.candidates[0].content.parts[0].text
  const clean = text.replace(/```json|```/g, '').trim()

  try {
    const budget = JSON.parse(clean)
    return res.status(200).json(budget)
  } catch {
    return res.status(502).json({ error: 'Failed to parse Gemini response' })
  }
}
