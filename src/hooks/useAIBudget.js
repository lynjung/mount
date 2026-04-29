import { useState } from 'react'

export function useAIBudget() {
  const [budget, setBudget] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const generate = async (transactions) => {
    setLoading(true)
    setError(null)
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`

      const response = await fetch(url, {
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

      if (response.status === 429) {
        setError('Rate limited — try again in a moment.')
        return
      }
      if (!response.ok) {
        setError(`Gemini error: ${response.status}`)
        return
      }

      const data = await response.json()
      const text = data.candidates[0].content.parts[0].text
      const clean = text.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(clean)
      setBudget(parsed)
    } catch (e) {
      setError('Something went wrong. Check your API key and try again.')
      console.error('AI budget error:', e)
    } finally {
      setLoading(false)
    }
  }

  return { budget, loading, error, generate }
}
