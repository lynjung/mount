import { Logo } from './Logo'

export function EmptyState({ onAddAccount, onSkip }) {
  return (
    <div style={{ minHeight: '100dvh', background: '#F8FAF9', display: 'flex', flexDirection: 'column' }}>

      {/* Hero area */}
      <div style={{ background: '#0E1F1A', padding: '48px 24px 36px', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 24 }}>
          <Logo dark />
          <span style={{ fontSize: 18, fontWeight: 600, color: '#E8F5F0', letterSpacing: '-0.3px' }}>Mount</span>
        </div>

        <div style={{ fontSize: 34, fontWeight: 500, letterSpacing: '-1.5px', color: '#4A6B5C', marginBottom: 6 }}>
          $0.00
        </div>
        <div style={{ fontSize: 13, color: 'rgba(232,245,240,0.4)', marginBottom: 28 }}>
          Add an account to get started
        </div>

        {/* Ghost currency toggle */}
        <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginBottom: 32 }}>
          {['$ USD', '₩ KRW'].map((label, i) => (
            <div key={label} style={{
              fontSize: 11, fontWeight: 500, padding: '5px 14px', borderRadius: 20,
              background: i === 0 ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.07)',
              color: i === 0 ? '#E8F5F0' : 'rgba(232,245,240,0.45)',
              border: `1px solid ${i === 0 ? 'rgba(255,255,255,0.36)' : 'rgba(255,255,255,0.12)'}`,
            }}>{label}</div>
          ))}
        </div>

        {/* Stats ghost */}
        <div style={{ display: 'flex', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 16 }}>
          {['Income', 'Expenses', 'Net'].map(label => (
            <div key={label} style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: 'rgba(232,245,240,0.3)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'rgba(232,245,240,0.2)' }}>—</div>
            </div>
          ))}
        </div>
      </div>

      {/* Ghost account placeholders */}
      <div style={{ padding: '20px 16px' }}>
        <div style={{ fontSize: 11, fontWeight: 500, color: '#4A6B5C', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 10 }}>
          Accounts
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} style={{
              height: 80, borderRadius: 12,
              border: '1px dashed #95D5B2',
              background: 'transparent',
            }} />
          ))}
        </div>
      </div>

      {/* Welcome message + CTA */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 32px 40px', textAlign: 'center' }}>
        <div style={{ fontSize: 22, fontWeight: 600, color: '#0E1F1A', marginBottom: 8, letterSpacing: '-0.5px' }}>
          Welcome to Mount
        </div>
        <div style={{ fontSize: 13, color: '#4A6B5C', marginBottom: 6 }}>
          티끌 모아 태산
        </div>
        <div style={{ fontSize: 12, color: '#7A9E8E', marginBottom: 32 }}>
          every penny counts.
        </div>

        <button
          onClick={onAddAccount}
          style={{
            width: '100%', maxWidth: 280,
            padding: '14px 0', fontSize: 15, fontWeight: 600,
            background: '#1A3D30', color: '#E8F5F0',
            border: 'none', borderRadius: 20, cursor: 'pointer',
            fontFamily: 'inherit', marginBottom: 14,
          }}
        >
          + Add First Account
        </button>

        <button
          onClick={onSkip}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 13, color: '#7A9E8E', fontFamily: 'inherit',
          }}
        >
          Skip for now
        </button>
      </div>
    </div>
  )
}
