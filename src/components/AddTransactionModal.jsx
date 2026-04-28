import { useState } from 'react'
import { CATEGORY_KEYS, CATEGORIES } from '../utils/categories'

const today = () => new Date().toISOString().slice(0, 10)

const EMPTY = {
  name: '', amount: '', type: 'expense', currency: 'USD',
  accountId: '', category: 'food', date: today(), recurring: false, note: '',
}

export function AddTransactionModal({ accounts, onSave, onClose }) {
  const [form, setForm] = useState({ ...EMPTY, accountId: accounts[0]?.id || '' })
  const [error, setError] = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = () => {
    if (!form.name.trim()) return setError('Name is required.')
    const amt = parseFloat(form.amount)
    if (!form.amount || isNaN(amt) || amt <= 0) return setError('Enter a valid amount.')
    if (!form.accountId) return setError('Select an account.')
    setError('')
    onSave({
      id: crypto.randomUUID(),
      ...form,
      amount: amt,
      name: form.name.trim(),
      note: form.note.trim(),
    })
    onClose()
  }

  return (
    <Overlay onClose={onClose}>
      <div style={{ fontSize: 16, fontWeight: 600, color: '#0E1F1A', marginBottom: 20 }}>
        Add Transaction
      </div>

      <Field label="Name">
        <input
          autoFocus
          value={form.name}
          onChange={e => set('name', e.target.value)}
          placeholder="e.g. Coffee"
          style={inputStyle}
        />
      </Field>

      <Field label="Type">
        <div style={{ display: 'flex', gap: 8 }}>
          {['expense', 'income'].map(t => (
            <TypeBtn key={t} active={form.type === t} onClick={() => set('type', t)}
              color={t === 'income' ? '#52B788' : '#E63946'}>
              {t === 'income' ? '+ Income' : '− Expense'}
            </TypeBtn>
          ))}
        </div>
      </Field>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Amount">
          <input
            type="number" min="0" step="0.01"
            value={form.amount}
            onChange={e => set('amount', e.target.value)}
            placeholder="0.00"
            style={inputStyle}
          />
        </Field>
        <Field label="Currency">
          <select value={form.currency} onChange={e => set('currency', e.target.value)} style={inputStyle}>
            <option value="USD">USD</option>
            <option value="KRW">KRW</option>
          </select>
        </Field>
      </div>

      <Field label="Account">
        <select value={form.accountId} onChange={e => set('accountId', e.target.value)} style={inputStyle}>
          {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </Field>

      <Field label="Category">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {CATEGORY_KEYS.map(k => {
            const { icon, label } = CATEGORIES[k]
            const active = form.category === k
            return (
              <button key={k} onClick={() => set('category', k)} style={{
                fontSize: 11, padding: '5px 10px', borderRadius: 8, cursor: 'pointer',
                border: `1px solid ${active ? '#1A3D30' : '#D8F3DC'}`,
                background: active ? '#1A3D30' : '#F8FAF9',
                color: active ? '#E8F5F0' : '#4A6B5C', fontFamily: 'inherit',
              }}>
                {icon} {label}
              </button>
            )
          })}
        </div>
      </Field>

      <Field label="Date">
        <input type="date" value={form.date} onChange={e => set('date', e.target.value)} style={inputStyle} />
      </Field>

      <Field label="Note (optional)">
        <input value={form.note} onChange={e => set('note', e.target.value)} placeholder="Add a note…" style={inputStyle} />
      </Field>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <Toggle checked={form.recurring} onChange={v => set('recurring', v)} />
        <span style={{ fontSize: 13, color: '#4A6B5C' }}>Recurring</span>
      </div>

      {error && <div style={{ fontSize: 12, color: '#E63946', marginBottom: 12 }}>{error}</div>}

      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onClose} style={{ ...btnStyle, background: '#F0F4F2', color: '#4A6B5C', flex: 1 }}>
          Cancel
        </button>
        <button onClick={handleSave} style={{ ...btnStyle, background: '#1A3D30', color: '#E8F5F0', flex: 2 }}>
          Save Transaction
        </button>
      </div>
    </Overlay>
  )
}

function Overlay({ onClose, children }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(14,31,26,0.5)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        zIndex: 200,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: '20px 20px 0 0',
          padding: '24px 20px', width: '100%', maxWidth: 480,
          maxHeight: '90vh', overflowY: 'auto',
        }}
      >
        {children}
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 500, color: '#4A6B5C', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>
        {label}
      </div>
      {children}
    </div>
  )
}

function TypeBtn({ children, active, onClick, color }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, padding: '8px 0', fontSize: 13, fontWeight: 500, borderRadius: 10,
      border: `1.5px solid ${active ? color : '#E8F5F0'}`,
      background: active ? color + '18' : '#F8FAF9',
      color: active ? color : '#7A9E8E', cursor: 'pointer', fontFamily: 'inherit',
    }}>
      {children}
    </button>
  )
}

function Toggle({ checked, onChange }) {
  return (
    <div onClick={() => onChange(!checked)} style={{
      width: 36, height: 20, borderRadius: 10, cursor: 'pointer',
      background: checked ? '#1A3D30' : '#D8F3DC',
      position: 'relative', transition: 'background 0.2s', flexShrink: 0,
    }}>
      <div style={{
        position: 'absolute', top: 3, left: checked ? 18 : 3,
        width: 14, height: 14, borderRadius: '50%', background: '#fff',
        transition: 'left 0.2s',
      }} />
    </div>
  )
}

const inputStyle = {
  width: '100%', padding: '9px 12px', fontSize: 13,
  border: '1px solid #D8F3DC', borderRadius: 10,
  background: '#F8FAF9', color: '#0E1F1A', outline: 'none',
  fontFamily: 'inherit',
}

const btnStyle = {
  padding: '12px 0', fontSize: 14, fontWeight: 600, borderRadius: 12,
  border: 'none', cursor: 'pointer', fontFamily: 'inherit',
}
