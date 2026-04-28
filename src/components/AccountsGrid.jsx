import { AccountCard } from './AccountCard'

export function AccountsGrid({ accounts, rate, onAccountClick }) {
  return (
    <div style={{ padding: '16px 16px 0' }}>
      <div style={{ fontSize: 11, fontWeight: 500, color: '#4A6B5C', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 10 }}>
        Accounts
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 10,
      }}>
        {accounts.map(a => (
          <AccountCard
            key={a.id}
            account={a}
            rate={rate}
            onClick={() => onAccountClick?.(a)}
          />
        ))}
      </div>
    </div>
  )
}
