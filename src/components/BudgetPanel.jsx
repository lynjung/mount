import { useMemo } from 'react'
import { useAIBudget } from '../hooks/useAIBudget'
import { toUSD } from '../utils/currency'
import { CATEGORIES } from '../utils/categories'

const BUDGET_CATS = ['food', 'transport', 'shopping', 'utilities', 'entertainment']

export function BudgetPanel({ transactions, rate }) {
  const { budget, loading, error, generate } = useAIBudget()

  const now = new Date()
  const yyyyMM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const monthExpenses = useMemo(() =>
    transactions.filter(t => t.type === 'expense' && t.date.startsWith(yyyyMM)),
    [transactions, yyyyMM]
  )

  const spentByCategory = useMemo(() => {
    const map = {}
    monthExpenses.forEach(t => {
      const usd = toUSD(t.amount, t.currency, rate || 1)
      map[t.category] = (map[t.category] || 0) + usd
    })
    return map
  }, [monthExpenses, rate])

  const handleGenerate = () => generate(monthExpenses)

  return (
    <div style={{ padding: '16px 16px 0' }}>
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8F5F0', overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #F0F4F2' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#0E1F1A' }}>AI Budget</div>
            <div style={{ fontSize: 11, color: '#7A9E8E', marginTop: 2 }}>Powered by Gemini</div>
          </div>
          <button
            onClick={handleGenerate}
            disabled={loading}
            style={{
              fontSize: 12, fontWeight: 600, padding: '7px 14px', borderRadius: 10,
              border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
              background: loading ? '#D8F3DC' : '#1A3D30',
              color: loading ? '#2D6A4F' : '#E8F5F0',
              fontFamily: 'inherit',
            }}
          >
            {loading ? 'Generating…' : budget ? '↻ Refresh' : '✦ Generate'}
          </button>
        </div>

        {!budget && !loading && (
          <div style={{ padding: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>✦</div>
            <div style={{ fontSize: 13, color: '#4A6B5C', fontWeight: 500, marginBottom: 4 }}>AI Budget Suggestions</div>
            <div style={{ fontSize: 12, color: '#7A9E8E' }}>
              {import.meta.env.VITE_GEMINI_API_KEY
                ? 'Generate personalized budget limits based on this month\'s spending.'
                : 'Add VITE_GEMINI_API_KEY to .env to enable AI budgets.'}
            </div>
          </div>
        )}

        {loading && (
          <div style={{ padding: 24, textAlign: 'center', fontSize: 13, color: '#7A9E8E' }}>
            Analyzing your transactions…
          </div>
        )}

        {error && !loading && (
          <div style={{ padding: '16px 20px', fontSize: 13, color: '#9B2226', background: '#FFF5F5', borderTop: '1px solid #FFE5E7' }}>
            ⚠️ {error}
          </div>
        )}

        {budget && !loading && (
          <div style={{ padding: '12px 0' }}>
            {BUDGET_CATS.map(cat => {
              const limit = budget[cat] || 0
              const spent = spentByCategory[cat] || 0
              const pct = limit > 0 ? Math.min((spent / limit) * 100, 120) : 0
              const displayPct = limit > 0 ? (spent / limit) * 100 : 0

              const barColor = displayPct >= 100 ? '#E63946' : displayPct >= 75 ? '#D4A017' : '#1A3D30'
              const warning = displayPct >= 100
                ? 'Over budget'
                : displayPct >= 75
                ? 'Almost at limit'
                : null

              const { icon, label } = CATEGORIES[cat] || {}

              return (
                <div key={cat} style={{ padding: '10px 16px', borderBottom: '1px solid #F0F4F2' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 16 }}>{icon}</span>
                      <span style={{ fontSize: 13, fontWeight: 500, color: '#0E1F1A' }}>{label}</span>
                      {warning && (
                        <span style={{
                          fontSize: 9, fontWeight: 600, padding: '2px 6px', borderRadius: 4,
                          background: displayPct >= 100 ? '#FFE5E7' : '#FFF8E1',
                          color: displayPct >= 100 ? '#9B2226' : '#7A5900',
                          letterSpacing: '0.04em', textTransform: 'uppercase',
                        }}>
                          {warning}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: '#4A6B5C' }}>
                      <span style={{ fontWeight: 600, color: barColor }}>${Math.round(spent)}</span>
                      <span style={{ color: '#7A9E8E' }}> / ${Math.round(limit)}</span>
                    </div>
                  </div>
                  <div style={{ height: 6, background: '#F0F4F2', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 3,
                      width: `${pct}%`,
                      background: barColor,
                      transition: 'width 0.4s ease',
                    }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
