import { useState, useMemo } from 'react'
import { DAYS, MONTH_NAMES, getDaysInMonth, getFirstDayOfWeek, formatDate } from '../utils/dates'
import { toUSD } from '../utils/currency'
import { TransactionRow } from './TransactionRow'

export function CalendarView({ transactions, accounts, rate }) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [selectedDay, setSelectedDay] = useState(null)

  const todayStr = formatDate(now.getFullYear(), now.getMonth(), now.getDate())

  const accountMap = useMemo(() =>
    Object.fromEntries(accounts.map(a => [a.id, a.name])), [accounts])

  // Aggregate totals per day
  const dayTotals = useMemo(() => {
    const map = {}
    transactions.forEach(t => {
      const prefix = `${year}-${String(month + 1).padStart(2, '0')}`
      if (!t.date.startsWith(prefix)) return
      if (!map[t.date]) map[t.date] = { income: 0, expense: 0 }
      const usd = toUSD(t.amount, t.currency, rate || 1)
      if (t.type === 'income') map[t.date].income += usd
      else map[t.date].expense += usd
    })
    return map
  }, [transactions, year, month, rate])

  const selectedDateStr = selectedDay
    ? formatDate(year, month, selectedDay)
    : null

  const selectedTx = selectedDateStr
    ? transactions.filter(t => t.date === selectedDateStr)
    : []

  const firstDow = getFirstDayOfWeek(year, month)
  const daysInMonth = getDaysInMonth(year, month)
  const cells = [...Array(firstDow).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]

  const prevMonth = () => { if (month === 0) { setYear(y => y - 1); setMonth(11) } else setMonth(m => m - 1); setSelectedDay(null) }
  const nextMonth = () => { if (month === 11) { setYear(y => y + 1); setMonth(0) } else setMonth(m => m + 1); setSelectedDay(null) }

  return (
    <div>
      {/* Month header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 16px 10px' }}>
        <button onClick={prevMonth} style={navBtn}>‹</button>
        <span style={{ fontSize: 15, fontWeight: 600, color: '#0E1F1A' }}>
          {MONTH_NAMES[month]} {year}
        </span>
        <button onClick={nextMonth} style={navBtn}>›</button>
      </div>

      {/* Day-of-week headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', padding: '0 8px', marginBottom: 2 }}>
        {DAYS.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 500, color: '#7A9E8E', letterSpacing: '0.05em', padding: '4px 0' }}>
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, padding: '0 8px' }}>
        {cells.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} />

          const dateStr = formatDate(year, month, day)
          const totals = dayTotals[dateStr]
          const isToday = dateStr === todayStr
          const isSelected = day === selectedDay

          return (
            <div
              key={day}
              onClick={() => setSelectedDay(day === selectedDay ? null : day)}
              style={{
                height: 40,
                borderRadius: 6,
                border: isSelected
                  ? '1px solid #1A3D30'
                  : isToday
                  ? '1px solid #2D6A4F'
                  : '1px solid transparent',
                background: isSelected ? '#E8F5F0' : 'transparent',
                cursor: 'pointer',
                overflow: 'hidden',
                padding: '2px 3px',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
              }}
            >
              <div style={{ fontSize: 11, fontWeight: isToday ? 600 : 400, color: isToday ? '#1A3D30' : '#0E1F1A', lineHeight: 1.4 }}>
                {day}
              </div>
              {totals?.income > 0 && (
                <div style={{ fontSize: 7.5, color: '#52B788', lineHeight: 1.2, width: '100%', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  +${Math.round(totals.income)}
                </div>
              )}
              {totals?.expense > 0 && (
                <div style={{ fontSize: 7.5, color: '#E63946', lineHeight: 1.2, width: '100%', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  −${Math.round(totals.expense)}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Selected day transactions */}
      {selectedDay && (
        <div style={{ marginTop: 16 }}>
          <div style={{ padding: '0 16px 8px', fontSize: 11, fontWeight: 500, color: '#4A6B5C', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
            {MONTH_NAMES[month]} {selectedDay}
          </div>
          <div style={{ background: '#fff', borderRadius: 12, margin: '0 16px', overflow: 'hidden', border: '1px solid #E8F5F0' }}>
            {selectedTx.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', fontSize: 13, color: '#7A9E8E' }}>No transactions</div>
            ) : (
              selectedTx.map(t => (
                <TransactionRow key={t.id} transaction={t} accountName={accountMap[t.accountId] || '—'} />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const navBtn = {
  background: 'none', border: 'none', fontSize: 20, cursor: 'pointer',
  color: '#1A3D30', padding: '4px 10px', borderRadius: 8,
  fontFamily: 'inherit',
}
