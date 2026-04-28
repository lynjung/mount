import { CATEGORIES } from '../utils/categories'
import { fmt } from '../utils/currency'

export function TransactionRow({ transaction, accountName }) {
  const { name, amount, type, currency, category, date, recurring, note } = transaction
  const cat = CATEGORIES[category] || CATEGORIES.other
  const isIncome = type === 'income'

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '11px 16px',
      borderBottom: '1px solid #F0F4F2',
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
        background: cat.color + '18',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 17,
      }}>
        {cat.icon}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: '#0E1F1A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {name}
          </span>
          {recurring && (
            <span style={{
              fontSize: 9, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase',
              background: '#E8F5F0', color: '#2D6A4F', borderRadius: 4, padding: '2px 5px', flexShrink: 0,
            }}>
              recurring
            </span>
          )}
        </div>
        <div style={{ fontSize: 11, color: '#7A9E8E', marginTop: 2 }}>
          {accountName} · {date}
          {note ? ` · ${note}` : ''}
        </div>
      </div>

      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: isIncome ? '#52B788' : '#E63946' }}>
          {isIncome ? '+' : '−'}{fmt(amount, currency)}
        </div>
        <div style={{ fontSize: 10, color: '#7A9E8E', marginTop: 1 }}>{currency}</div>
      </div>
    </div>
  )
}
