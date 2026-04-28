import { useState } from 'react'
import { Logo } from './Logo'
import { fmtUSD, fmtKRW, toUSD, toKRW } from '../utils/currency'

export function Hero({ accounts, transactions, rate }) {
  const [currency, setCurrency] = useState('usd')

  const today = new Date()
  const yyyyMM = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`

  const monthTx = transactions.filter(t => t.date.startsWith(yyyyMM))

  const totalUSD = accounts.reduce((sum, a) => {
    if (!rate) return sum
    return sum + toUSD(a.balance, a.currency, rate)
  }, 0)
  const totalKRW = rate ? totalUSD * rate : 0

  const incomeUSD = monthTx
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + toUSD(t.amount, t.currency, rate || 1), 0)

  const expenseUSD = monthTx
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + toUSD(t.amount, t.currency, rate || 1), 0)

  const netUSD = incomeUSD - expenseUSD

  const primaryBalance = currency === 'usd' ? fmtUSD(totalUSD) : fmtKRW(totalKRW)
  const secondaryBalance = currency === 'usd'
    ? (rate ? fmtKRW(totalKRW) : '—')
    : fmtUSD(totalUSD)

  const fmtStat = (usd) => currency === 'usd' ? fmtUSD(usd) : fmtKRW(rate ? usd * rate : usd)

  return (
    <div style={{
      background: '#0E1F1A',
      padding: '28px 20px 24px',
      color: '#E8F5F0',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <Logo dark />
        <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.3px', color: '#E8F5F0' }}>Mount</span>
      </div>

      <div style={{ marginBottom: 4, fontSize: 11, color: 'rgba(232,245,240,0.5)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
        Total Balance
      </div>

      <div style={{ fontSize: 34, fontWeight: 500, letterSpacing: '-1.5px', marginBottom: 4 }}>
        {rate ? primaryBalance : '—'}
      </div>

      <div style={{ fontSize: 13, color: 'rgba(232,245,240,0.5)', marginBottom: 20 }}>
        {secondaryBalance}
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 24 }}>
        {['usd', 'krw'].map(c => (
          <div
            key={c}
            onClick={() => setCurrency(c)}
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 500, padding: '5px 14px', borderRadius: 20,
              cursor: 'pointer', userSelect: 'none',
              background: currency === c ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.07)',
              color: currency === c ? '#E8F5F0' : 'rgba(232,245,240,0.45)',
              border: `1px solid ${currency === c ? 'rgba(255,255,255,0.36)' : 'rgba(255,255,255,0.12)'}`,
            }}
          >
            {c === 'usd' ? '$ USD' : '₩ KRW'}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 0, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 16 }}>
        {[
          { label: 'Income',   value: fmtStat(incomeUSD), color: '#52B788' },
          { label: 'Expenses', value: fmtStat(expenseUSD), color: '#E63946' },
          { label: 'Net',      value: fmtStat(netUSD),     color: netUSD >= 0 ? '#52B788' : '#E63946' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: 'rgba(232,245,240,0.45)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 4 }}>
              {label}
            </div>
            <div style={{ fontSize: 13, fontWeight: 500, color }}>{value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
