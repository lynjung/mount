import { useState } from 'react'
import type { Budget, Transaction } from '../types'

export function useAIBudget() {
  const [budget, setBudget] = useState<Budget | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generate = async (transactions: Transaction[]) => {
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
        const { error: msg } = await response.json().catch(() => ({})) as { error?: string }
        setError(msg ?? `Error: ${response.status}`)
        return
      }

      const budget = await response.json() as Budget
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
