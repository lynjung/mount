import { useState } from 'react'

export function useAIBudget() {
  const [budget, setBudget] = useState(null)
  const [loading, setLoading] = useState(false)

  const generate = async (transactions) => {
    setLoading(true)
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

      const data = await response.json()
      const text = data.candidates[0].content.parts[0].text
      const clean = text.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(clean)
      setBudget(parsed)
    } catch (e) {
      console.error('AI budget error:', e)
    } finally {
      setLoading(false)
    }
  }

  return { budget, loading, generate }
}
