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
      const summary = transactions.reduce<Record<string, number>>((acc, tx) => {
        if (tx.type !== 'expense') return acc
        acc[tx.category] = (acc[tx.category] ?? 0) + Math.abs(tx.amount)
        return acc
      }, {})

      const response = await fetch('/api/budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary }),
      })

      if (response.status === 429) {
        setError('Rate limit reached. Please wait a minute and try again.')
        return
      }
      if (!response.ok) {
        const { error: msg } = await response.json().catch(() => ({})) as { error?: string }
        setError(msg ?? `Unable to generate budget right now (${response.status}).`)
        return
      }

      const nextBudget = await response.json() as Budget
      setBudget(nextBudget)
    } catch (e) {
      setError('Something went wrong while generating AI budget suggestions.')
      console.error('AI budget error:', e)
    } finally {
      setLoading(false)
    }
  }

  return { budget, loading, error, generate }
}
