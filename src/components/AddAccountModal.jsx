import { useState } from 'react'
import { ColorPicker } from './ColorPicker'

const TYPES = [
  { key: 'bank',       label: 'Bank Account', icon: '🏦' },
  { key: 'credit',     label: 'Credit Card',  icon: '💳' },
  { key: 'cash',       label: 'Cash',         icon: '💵' },
  { key: 'investment', label: 'Investment',   icon: '📈' },
  { key: 'loan',       label: 'Loan',         icon: '📋' },
  { key: 'other',      label: 'Other',        icon: '📂' },
]

const STEPS = ['Type', 'Details', 'Color']

const EMPTY = {
  type: '', name: '', balance: '', currency: 'USD', color: '#1A3D30',
}

export function AddAccountModal({ onSave, onClose }) {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const next = () => {
    if (step === 0 && !form.type) return setError('Pick an account type.')
    if (step === 1) {
      if (!form.name.trim()) return setError('Name is required.')
      const bal = parseFloat(form.balance)
      if (form.balance === '' || isNaN(bal)) return setError('Enter a valid opening balance.')
    }
    setError('')
    setStep(s => s + 1)
  }

  const handleSave = () => {
    onSave({
      id: crypto.randomUUID(),
      name: form.name.trim(),
      type: form.type,
      currency: form.currency,
      balance: parseFloat(form.balance),
      color: form.color,
      createdAt: new Date().toISOString(),
    })
    onClose()
  }

  return (
    <Overlay onClose={onClose}>
      {/* Step indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20 }}>
        {STEPS.map((label, i) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 22, height: 22, borderRadius: '50%', fontSize: 11, fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: i <= step ? '#1A3D30' : '#E8F5F0',
              color: i <= step ? '#E8F5F0' : '#7A9E8E',
            }}>{i + 1}</div>
            <span style={{ fontSize: 12, color: i === step ? '#0E1F1A' : '#7A9E8E', fontWeight: i === step ? 600 : 400 }}>
              {label}
            </span>
            {i < STEPS.length - 1 && <div style={{ width: 16, height: 1, background: '#E8F5F0', marginLeft: 2 }} />}
          </div>
        ))}
      </div>

      {/* Step 0 — Type */}
      {step === 0 && (
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#0E1F1A', marginBottom: 16 }}>
            What type of account?
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {TYPES.map(({ key, label, icon }) => {
              const active = form.type === key
              return (
                <button key={key} onClick={() => { set('type', key); setError('') }} style={{
                  padding: '14px 12px', borderRadius: 12, cursor: 'pointer',
                  border: `1.5px solid ${active ? '#1A3D30' : '#E8F5F0'}`,
                  background: active ? '#E8F5F0' : '#F8FAF9',
                  textAlign: 'left', fontFamily: 'inherit',
                }}>
                  <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: active ? '#1A3D30' : '#0E1F1A' }}>{label}</div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Step 1 — Details */}
      {step === 1 && (
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#0E1F1A', marginBottom: 16 }}>
            Account details
          </div>

          <Field label="Account Name">
            <input
              autoFocus
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="e.g. Chase Checking"
              style={inputStyle}
            />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Opening Balance">
              <input
                type="number" step="0.01"
                value={form.balance}
                onChange={e => set('balance', e.target.value)}
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

          {/* Live preview */}
          <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid #E8F5F0', marginTop: 4 }}>
            <div style={{ height: 3, background: form.color }} />
            <div style={{ padding: '10px 14px', background: '#fff' }}>
              <div style={{ fontSize: 10, color: '#7A9E8E', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>
                {TYPES.find(t => t.key === form.type)?.label}
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#0E1F1A' }}>
                {form.name || 'Account Name'}
              </div>
              <div style={{ fontSize: 13, color: '#1A3D30', marginTop: 2 }}>
                {form.currency === 'USD' ? '$' : '₩'}{parseFloat(form.balance || 0).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 2 — Color */}
      {step === 2 && (
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#0E1F1A', marginBottom: 16 }}>
            Pick a color
          </div>
          <ColorPicker value={form.color} onChange={v => set('color', v)} />
        </div>
      )}

      {error && <div style={{ fontSize: 12, color: '#E63946', margin: '12px 0 0' }}>{error}</div>}

      {/* Footer buttons */}
      <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
        <button onClick={onClose} style={{ ...btnStyle, background: '#F0F4F2', color: '#4A6B5C', flex: 1 }}>
          Cancel
        </button>
        {step < 2 ? (
          <button onClick={next} style={{ ...btnStyle, background: '#1A3D30', color: '#E8F5F0', flex: 2 }}>
            Next →
          </button>
        ) : (
          <button onClick={handleSave} style={{ ...btnStyle, background: '#1A3D30', color: '#E8F5F0', flex: 2 }}>
            Add Account
          </button>
        )}
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

const inputStyle = {
  width: '100%', padding: '9px 12px', fontSize: 13,
  border: '1px solid #D8F3DC', borderRadius: 10,
  background: '#F8FAF9', color: '#0E1F1A', outline: 'none',
  fontFamily: 'inherit',
}

const btnStyle = {
  padding: '12px 0', fontSize: 14, fontWeight: 600,
  borderRadius: 12, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
}
