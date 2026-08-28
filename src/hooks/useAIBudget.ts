import { useState } from 'react'
import type { Budget, Transaction } from '../types'

const BUDGET_CACHE_KEY = 'mount_ai_budget'
const BUDGET_CACHE_VERSION = 2
const BUDGET_KEYS = ['food', 'transport', 'shopping', 'utilities', 'entertainment']
const MAX_REASONABLE_LIMIT = 100000

function isValidBudgetValue(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= MAX_REASONABLE_LIMIT
}

function normalizeBudget(raw: unknown): Budget | null {
  if (!raw || typeof raw !== 'object') return null

  const candidate = raw as Record<string, unknown>
  const normalized: Partial<Budget> = {}

  for (const key of BUDGET_KEYS) {
    const value = candidate[key]
    if (typeof value === 'string') {
      const cleaned = value.replace(/[$,\s]/g, '')
      const parsed = Number(cleaned)
      if (!isValidBudgetValue(parsed)) {
        return null
      }
      normalized[key as keyof Budget] = parsed
      continue
    }

    if (!isValidBudgetValue(value)) {
      return null
    }
    normalized[key as keyof Budget] = value
  }

  return BUDGET_KEYS.reduce((acc, key) => {
    const val = normalized[key as keyof Budget]
    if (val === undefined) {
      return acc
    }
    acc[key as keyof Budget] = Number(val)
    return acc
  }, {} as Budget)
}

function loadPersistedBudget(): Budget | null {
  try {
    const item = localStorage.getItem(BUDGET_CACHE_KEY)
    if (!item) return null
    const parsed = JSON.parse(item) as { version?: number, budget?: unknown }
    if (parsed.version !== BUDGET_CACHE_VERSION) {
      localStorage.removeItem(BUDGET_CACHE_KEY)
      return null
    }
    const normalized = normalizeBudget(parsed.budget)
    if (!normalized) {
      localStorage.removeItem(BUDGET_CACHE_KEY)
      return null
    }
    return normalized
  } catch {
    localStorage.removeItem(BUDGET_CACHE_KEY)
    return null
  }
}

function persistBudget(budget: Budget) {
  localStorage.setItem(BUDGET_CACHE_KEY, JSON.stringify({ version: BUDGET_CACHE_VERSION, budget }))
}

export function useAIBudget() {
  const [budget, setBudget] = useState<Budget | null>(() => loadPersistedBudget())
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

      const nextBudget = normalizeBudget(await response.json())
      if (!nextBudget) {
        setError('Received an invalid AI budget recommendation.')
        localStorage.removeItem(BUDGET_CACHE_KEY)
        return
      }

      setBudget(nextBudget)
      persistBudget(nextBudget)
    } catch (e) {
      setError('Something went wrong while generating AI budget suggestions.')
      console.error('AI budget error:', e)
    } finally {
      setLoading(false)
    }
  }

  return { budget, loading, error, generate }
}
