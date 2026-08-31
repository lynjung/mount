export type Currency = 'USD' | 'KRW'
export type TransactionType = 'income' | 'expense'
export type AccountType = 'bank' | 'credit' | 'cash' | 'investment' | 'loan' | 'other'

export interface Account {
  id: string
  name: string
  type: AccountType
  currency: Currency
  balance: number
  color: string
  created_at?: string
}

export interface Transaction {
  id: string
  accountId: string
  name: string
  amount: number
  type: TransactionType
  currency: Currency
  category: string
  date: string
  recurring: boolean
  note: string
}

export interface Goal {
  id: string
  name: string
  emoji: string
  targetAmount: number
  currency: Currency
  savedAmount: number
  accountId: string | null
  targetDate: string | null
}

export type BudgetKey = 'food' | 'transport' | 'shopping' | 'utilities' | 'entertainment'

export interface Budget {
  recommendedLimitCents: Record<BudgetKey, number>
}
