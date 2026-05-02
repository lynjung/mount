export interface Category {
  label: string
  icon: string
  color: string
}

export const CATEGORIES: Record<string, Category> = {
  food:          { label: 'Food',          icon: '🍜', color: '#E76F51' },
  transport:     { label: 'Transport',     icon: '🚇', color: '#0096C7' },
  shopping:      { label: 'Shopping',      icon: '🛍️', color: '#C77DFF' },
  utilities:     { label: 'Utilities',     icon: '💡', color: '#D4A017' },
  entertainment: { label: 'Entertainment', icon: '🎬', color: '#4361EE' },
  income:        { label: 'Income',        icon: '💰', color: '#52B788' },
  transfer:      { label: 'Transfer',      icon: '↔️',  color: '#7A9E8E' },
  other:         { label: 'Other',         icon: '📌', color: '#6C757D' },
}

export const CATEGORY_KEYS: string[] = Object.keys(CATEGORIES)
