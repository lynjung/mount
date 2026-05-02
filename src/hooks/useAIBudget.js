import { useState } from 'react'

export function useAIBudget() {
  const [budget, setBudget] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const generate = async (transactions) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions }),
      })

      if (response.status === 429) {
        setError('Rate limited — try again in a moment.')
        return
      }
      if (!response.ok) {
        const { error: msg } = await response.json().catch(() => ({}))
        setError(msg || `Error: ${response.status}`)
        return
      }

      const budget = await response.json()
      setBudget(budget)
    } catch (e) {
      setError('Something went wrong. Please try again.')
      console.error('AI budget error:', e)
    } finally {
      setLoading(false)
    }
  }

  return { budget, loading, error, generate }
}
