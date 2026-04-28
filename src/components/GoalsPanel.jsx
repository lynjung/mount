import { useState } from 'react'
import { fmt, fmtUSD } from '../utils/currency'

export function GoalsPanel({ goals, accounts, onAdd, onUpdate }) {
  const [showForm, setShowForm] = useState(false)

  return (
    <div style={{ padding: '16px 16px 0' }}>
      <div style={{ fontSize: 11, fontWeight: 500, color: '#4A6B5C', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 10 }}>
        Goals
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {goals.map(g => <GoalCard key={g.id} goal={g} onUpdate={onUpdate} />)}

        {/* Add new goal — dashed card */}
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            style={{
              width: '100%', padding: '20px', borderRadius: 12, cursor: 'pointer',
              border: '1.5px dashed #95D5B2', background: 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              fontSize: 13, fontWeight: 500, color: '#2D6A4F', fontFamily: 'inherit',
            }}
          >
            + New Goal
          </button>
        ) : (
          <NewGoalForm accounts={accounts} onSave={(g) => { onAdd(g); setShowForm(false) }} onCancel={() => setShowForm(false)} />
        )}
      </div>
    </div>
  )
}

function GoalCard({ goal, onUpdate }) {
  const { emoji, name, savedAmount, targetAmount, currency, targetDate } = goal
  const pct = targetAmount > 0 ? Math.min((savedAmount / targetAmount) * 100, 100) : 0
  const isNearDone = pct >= 90
  const daysLeft = targetDate ? Math.ceil((new Date(targetDate) - new Date()) / 86400000) : null

  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8F5F0', overflow: 'hidden' }}>
      <div style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 24 }}>{emoji}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0E1F1A' }}>{name}</div>
              {daysLeft !== null && (
                <div style={{ fontSize: 11, color: daysLeft < 30 ? '#D4A017' : '#7A9E8E', marginTop: 2 }}>
                  {daysLeft > 0 ? `${daysLeft} days left` : 'Past target date'}
                </div>
              )}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1A3D30' }}>{fmt(savedAmount, currency)}</div>
            <div style={{ fontSize: 11, color: '#7A9E8E' }}>of {fmt(targetAmount, currency)}</div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height: 6, background: '#F0F4F2', borderRadius: 3, overflow: 'hidden', marginBottom: 6 }}>
          <div style={{
            height: '100%', borderRadius: 3,
            width: `${pct}%`,
            background: isNearDone ? '#52B788' : '#1A3D30',
            transition: 'width 0.4s ease',
          }} />
        </div>
        <div style={{ fontSize: 11, color: '#7A9E8E' }}>{Math.round(pct)}% saved</div>
      </div>
    </div>
  )
}

function NewGoalForm({ accounts, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: '', emoji: '🎯', targetAmount: '', currency: 'USD',
    savedAmount: '', accountId: accounts[0]?.id || '', targetDate: '',
  })
  const [error, setError] = useState('')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const EMOJIS = ['🎯','✈️','🏠','🛡️','🎓','💻','🚗','💍','🌴','🎸','📷','🏋️']

  const handleSave = () => {
    if (!form.name.trim()) return setError('Name is required.')
    const target = parseFloat(form.targetAmount)
    if (!form.targetAmount || isNaN(target) || target <= 0) return setError('Enter a valid target amount.')
    setError('')
    onSave({
      id: crypto.randomUUID(),
      name: form.name.trim(),
      emoji: form.emoji,
      targetAmount: target,
      currency: form.currency,
      savedAmount: parseFloat(form.savedAmount) || 0,
      accountId: form.accountId,
      targetDate: form.targetDate || null,
      createdAt: new Date().toISOString(),
    })
  }

  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1.5px solid #1A3D30', padding: '16px' }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#0E1F1A', marginBottom: 14 }}>New Goal</div>

      {/* Emoji picker */}
      <div style={{ marginBottom: 12 }}>
        <div style={labelStyle}>Emoji</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {EMOJIS.map(e => (
            <button key={e} onClick={() => set('emoji', e)} style={{
              fontSize: 20, width: 36, height: 36, borderRadius: 8, cursor: 'pointer',
              border: `1.5px solid ${form.emoji === e ? '#1A3D30' : '#E8F5F0'}`,
              background: form.emoji === e ? '#E8F5F0' : '#F8FAF9',
              fontFamily: 'inherit',
            }}>{e}</button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={labelStyle}>Goal Name</div>
        <input value={form.name} onChange={e => set('name', e.target.value)}
          placeholder="e.g. Emergency Fund" style={inputStyle} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
        <div>
          <div style={labelStyle}>Target Amount</div>
          <input type="number" min="0" value={form.targetAmount} onChange={e => set('targetAmount', e.target.value)}
            placeholder="0" style={inputStyle} />
        </div>
        <div>
          <div style={labelStyle}>Currency</div>
          <select value={form.currency} onChange={e => set('currency', e.target.value)} style={inputStyle}>
            <option value="USD">USD</option>
            <option value="KRW">KRW</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
        <div>
          <div style={labelStyle}>Already Saved</div>
          <input type="number" min="0" value={form.savedAmount} onChange={e => set('savedAmount', e.target.value)}
            placeholder="0" style={inputStyle} />
        </div>
        <div>
          <div style={labelStyle}>Target Date</div>
          <input type="date" value={form.targetDate} onChange={e => set('targetDate', e.target.value)} style={inputStyle} />
        </div>
      </div>

      {error && <div style={{ fontSize: 12, color: '#E63946', marginBottom: 10 }}>{error}</div>}

      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onCancel} style={{ ...btnStyle, background: '#F0F4F2', color: '#4A6B5C', flex: 1 }}>Cancel</button>
        <button onClick={handleSave} style={{ ...btnStyle, background: '#1A3D30', color: '#E8F5F0', flex: 2 }}>Save Goal</button>
      </div>
    </div>
  )
}

const labelStyle = { fontSize: 11, fontWeight: 500, color: '#4A6B5C', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 5 }
const inputStyle = { width: '100%', padding: '8px 12px', fontSize: 13, border: '1px solid #D8F3DC', borderRadius: 10, background: '#F8FAF9', color: '#0E1F1A', outline: 'none', fontFamily: 'inherit' }
const btnStyle = { padding: '10px 0', fontSize: 13, fontWeight: 600, borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }
