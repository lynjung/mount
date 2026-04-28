import { fmt, toUSD, toKRW } from '../utils/currency'

export function AccountCard({ account, rate, onClick }) {
  const { name, type, currency, balance, color } = account

  const converted = rate
    ? currency === 'USD'
      ? fmtOther('KRW', toKRW(balance, 'USD', rate))
      : fmtOther('USD', toUSD(balance, 'KRW', rate))
    : null

  return (
    <div
      onClick={onClick}
      style={{
        background: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
        cursor: 'pointer',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        border: '1px solid #E8F5F0',
      }}
    >
      <div style={{ height: 3, background: color }} />
      <div style={{ padding: '12px 14px' }}>
        <div style={{ fontSize: 10, color: '#7A9E8E', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 4 }}>
          {TYPE_LABELS[type] || type}
        </div>
        <div style={{ fontSize: 13, fontWeight: 500, color: '#0E1F1A', marginBottom: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {name}
        </div>
        <div style={{ fontSize: 15, fontWeight: 600, color: balance < 0 ? '#E63946' : '#1A3D30', letterSpacing: '-0.3px' }}>
          {fmt(balance, currency)}
        </div>
        {converted && (
          <div style={{ fontSize: 11, color: '#7A9E8E', marginTop: 2 }}>{converted}</div>
        )}
      </div>
    </div>
  )
}

function fmtOther(cur, amt) {
  if (cur === 'KRW') return (amt < 0 ? '−₩' : '₩') + Math.round(Math.abs(amt)).toLocaleString('ko-KR')
  return (amt < 0 ? '−$' : '$') + Math.abs(amt).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const TYPE_LABELS = {
  bank: 'Bank Account',
  credit: 'Credit Card',
  cash: 'Cash',
  investment: 'Investment',
  loan: 'Loan',
  other: 'Other',
}
