import { useState } from 'react'
import { useLocalStorage } from './hooks/useLocalStorage'
import { useExchangeRate } from './hooks/useExchangeRate'
import { Hero } from './components/Hero'
import { AccountsGrid } from './components/AccountsGrid'
import { BottomNav } from './components/BottomNav'
import { TransactionList } from './components/TransactionList'
import { AddTransactionModal } from './components/AddTransactionModal'
import { CalendarView } from './components/CalendarView'
import { FXGraph } from './components/FXGraph'
import { AddAccountModal } from './components/AddAccountModal'
import { BudgetPanel } from './components/BudgetPanel'
import { GoalsPanel } from './components/GoalsPanel'
import { EmptyState } from './components/EmptyState'

const DESKTOP_TABS = ['Home', 'Transactions', 'Calendar', 'Trends', 'Goals']

export default function App() {
  const rate = useExchangeRate()
  const [accounts, setAccounts] = useLocalStorage('mount_accounts', [])
  const [goals, setGoals] = useLocalStorage('mount_goals', [])

  const [transactions, setTransactions] = useLocalStorage('mount_transactions', [])

  const [mobileTab, setMobileTab] = useState('home')
  const [desktopTab, setDesktopTab] = useState('Home')
  const [showAddTx, setShowAddTx] = useState(false)
  const [showAddAccount, setShowAddAccount] = useState(false)
  const [skippedEmpty, setSkippedEmpty] = useState(false)

  const addTransaction = (tx) => setTransactions(prev => [tx, ...prev])
  const addAccount = (acc) => setAccounts(prev => [...prev, acc])
  const addGoal = (g) => setGoals(prev => [...prev, g])
  const updateGoal = (g) => setGoals(prev => prev.map(x => x.id === g.id ? g : x))

  if (accounts.length === 0 && !skippedEmpty) {
    return (
      <>
        <EmptyState
          onAddAccount={() => { setSkippedEmpty(true); setShowAddAccount(true) }}
          onSkip={() => setSkippedEmpty(true)}
        />
        {showAddAccount && (
          <AddAccountModal onSave={addAccount} onClose={() => setShowAddAccount(false)} />
        )}
      </>
    )
  }

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>

      {/* ── Desktop top tabs (hidden on mobile) ── */}
      <div className="desktop-tabs">
        <div style={{
          display: 'flex', alignItems: 'center', gap: 2,
          borderBottom: '1px solid #E8F5F0', padding: '0 24px',
          background: '#fff',
        }}>
          {DESKTOP_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setDesktopTab(tab)}
              style={{
                padding: '14px 16px', fontSize: 13, fontWeight: desktopTab === tab ? 600 : 400,
                color: desktopTab === tab ? '#1A3D30' : '#7A9E8E',
                background: 'none', border: 'none', cursor: 'pointer',
                borderBottom: desktopTab === tab ? '2px solid #1A3D30' : '2px solid transparent',
                marginBottom: -1,
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ── Mobile: Home tab content ── */}
      <div className="mobile-only" style={{ paddingBottom: 72 }}>
        {mobileTab === 'home' && (
          <>
            <Hero accounts={accounts} transactions={transactions} rate={rate} />
            <AccountsGrid accounts={accounts} rate={rate} />
            <div style={{ padding: '10px 16px 0', textAlign: 'right' }}>
              <button onClick={() => setShowAddAccount(true)} style={{
                fontSize: 12, fontWeight: 500, color: '#1A3D30', background: 'none',
                border: '1px solid #D8F3DC', borderRadius: 8, padding: '6px 12px',
                cursor: 'pointer', fontFamily: 'inherit',
              }}>+ Add Account</button>
            </div>
          </>
        )}
        {mobileTab === 'calendar' && (
          <CalendarView transactions={transactions} accounts={accounts} rate={rate} />
        )}
        {mobileTab === 'transactions' && (
          <div style={{ paddingTop: 8 }}>
            <TransactionList transactions={transactions} accounts={accounts} />
          </div>
        )}
        {mobileTab === 'trends' && (
          <div style={{ paddingBottom: 24 }}>
            <FXGraph />
            <div style={{ height: 16 }} />
            <BudgetPanel transactions={transactions} rate={rate} />
          </div>
        )}
        {mobileTab === 'goals' && (
          <div style={{ paddingBottom: 24 }}>
            <GoalsPanel goals={goals} accounts={accounts} onAdd={addGoal} onUpdate={updateGoal} />
          </div>
        )}
        <BottomNav active={mobileTab} onChange={setMobileTab} />
      </div>

      {/* ── Desktop: tab content ── */}
      <div className="desktop-only" style={{ padding: 24 }}>
        {desktopTab === 'Home' && (
          <>
            <Hero accounts={accounts} transactions={transactions} rate={rate} />
            <AccountsGrid accounts={accounts} rate={rate} />
            <div style={{ padding: '10px 16px 0', textAlign: 'right' }}>
              <button onClick={() => setShowAddAccount(true)} style={{
                fontSize: 12, fontWeight: 500, color: '#1A3D30', background: 'none',
                border: '1px solid #D8F3DC', borderRadius: 8, padding: '6px 12px',
                cursor: 'pointer', fontFamily: 'inherit',
              }}>+ Add Account</button>
            </div>
          </>
        )}
        {desktopTab === 'Transactions' && (
          <TransactionList transactions={transactions} accounts={accounts} onAdd={() => setShowAddTx(true)} />
        )}
        {desktopTab === 'Calendar' && (
          <CalendarView transactions={transactions} accounts={accounts} rate={rate} />
        )}
        {desktopTab === 'Trends' && (
          <>
            <FXGraph />
            <div style={{ height: 16 }} />
            <BudgetPanel transactions={transactions} rate={rate} />
          </>
        )}
        {desktopTab === 'Goals' && (
          <GoalsPanel goals={goals} accounts={accounts} onAdd={addGoal} onUpdate={updateGoal} />
        )}
      </div>
      <button onClick={() => setShowAddTx(true)} className="fab">+</button>

      {showAddAccount && (
        <AddAccountModal
          onSave={addAccount}
          onClose={() => setShowAddAccount(false)}
        />
      )}
      {showAddTx && (
        <AddTransactionModal
          accounts={accounts}
          onSave={addTransaction}
          onClose={() => setShowAddTx(false)}
        />
      )}
    </div>
  )
}
