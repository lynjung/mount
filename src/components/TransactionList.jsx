import { useState, useMemo } from 'react'
import { TransactionRow } from './TransactionRow'
import { CATEGORIES, CATEGORY_KEYS } from '../utils/categories'

export function TransactionList({ transactions, accounts, onAdd }) {
  const [search, setSearch] = useState('')
  const [filterAccount, setFilterAccount] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterType, setFilterType] = useState('all')

  const accountMap = useMemo(() =>
    Object.fromEntries(accounts.map(a => [a.id, a.name])),
    [accounts]
  )

  const filtered = useMemo(() => {
    return transactions
      .filter(t => {
        if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false
        if (filterAccount !== 'all' && t.accountId !== filterAccount) return false
        if (filterCategory !== 'all' && t.category !== filterCategory) return false
        if (filterType !== 'all' && t.type !== filterType) return false
        return true
      })
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [transactions, search, filterAccount, filterCategory, filterType])

  return (
    <div>
      {/* Search + Add */}
      <div style={{ padding: '12px 16px 8px', display: 'flex', gap: 8 }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search transactions…"
          style={{
            flex: 1, padding: '9px 12px', fontSize: 13,
            border: '1px solid #D8F3DC', borderRadius: 10,
            background: '#F8FAF9', color: '#0E1F1A', outline: 'none',
            fontFamily: 'inherit',
          }}
        />
        {onAdd && (
          <button onClick={onAdd} style={{
            padding: '9px 16px', fontSize: 13, fontWeight: 600,
            background: '#1A3D30', color: '#E8F5F0',
            border: 'none', borderRadius: 10, cursor: 'pointer',
            fontFamily: 'inherit', flexShrink: 0,
          }}>+ Add</button>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 6, padding: '0 16px 12px', overflowX: 'auto' }}>
        <Select value={filterType} onChange={setFilterType}
          options={[['all','All types'],['income','Income'],['expense','Expense']]} />
        <Select value={filterAccount} onChange={setFilterAccount}
          options={[['all','All accounts'], ...accounts.map(a => [a.id, a.name])]} />
        <Select value={filterCategory} onChange={setFilterCategory}
          options={[['all','All categories'], ...CATEGORY_KEYS.map(k => [k, CATEGORIES[k].label])]} />
      </div>

      {/* Heading */}
      <div style={{ padding: '0 16px 8px', fontSize: 11, fontWeight: 500, color: '#4A6B5C', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
        {filtered.length} transaction{filtered.length !== 1 ? 's' : ''}
      </div>

      {/* Rows */}
      <div style={{ background: '#fff', borderRadius: 12, margin: '0 16px', overflow: 'hidden', border: '1px solid #E8F5F0' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', fontSize: 13, color: '#7A9E8E' }}>No transactions found</div>
        ) : (
          filtered.map(t => (
            <TransactionRow key={t.id} transaction={t} accountName={accountMap[t.accountId] || '—'} />
          ))
        )}
      </div>
    </div>
  )
}

function Select({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        fontSize: 11, padding: '5px 8px', borderRadius: 8,
        border: '1px solid #D8F3DC', background: '#F8FAF9',
        color: '#1A3D30', fontFamily: 'inherit', cursor: 'pointer',
        flexShrink: 0,
      }}
    >
      {options.map(([val, label]) => (
        <option key={val} value={val}>{label}</option>
      ))}
    </select>
  )
}
