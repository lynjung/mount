import { useState, useCallback } from 'react'
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
import { seedIfEmpty, resetDemoData, DEMO_MODE_KEY } from './utils/seedData'

const DESKTOP_TABS = ['Home', 'Transactions', 'Calendar', 'Trends', 'Budget']

function readLocalList(key, fallback = []) {
  try {
    const stored = JSON.parse(localStorage.getItem(key) || 'null')
    return Array.isArray(stored) ? stored : fallback
  } catch {
    return fallback
  }
}

function writeLocalList(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

export default function App() {
  const rate = useExchangeRate()
  const [demoMode, setDemoMode] = useState(() => {
    const seeded = !localStorage.getItem('mount_accounts') || !localStorage.getItem('mount_transactions') || !localStorage.getItem('mount_goals')
    return localStorage.getItem(DEMO_MODE_KEY) === 'true' || seeded
  })
  const [accounts, setAccounts] = useState(() => {
    seedIfEmpty()
    return readLocalList('mount_accounts', [])
  })
  const [transactions, setTransactions] = useState(() => readLocalList('mount_transactions', []))
  const [goals, setGoals] = useState(() => readLocalList('mount_goals', []))

  const [mobileTab, setMobileTab] = useState('home')
  const [desktopTab, setDesktopTab] = useState('Home')
  const [showAddTx, setShowAddTx] = useState(false)
  const [showAddAccount, setShowAddAccount] = useState(false)
  const [skippedEmpty, setSkippedEmpty] = useState(false)

  const addTransaction = useCallback((tx) => {
    const nextTxs = [...transactions, tx]
    const nextAccounts = accounts.map(account => {
      if (account.id !== tx.accountId) return account
      const delta = tx.type === 'expense' ? -tx.amount : tx.amount
      return { ...account, balance: Number((account.balance + delta).toFixed(2)) }
    })
    setTransactions(nextTxs)
    setAccounts(nextAccounts)
    writeLocalList('mount_transactions', nextTxs)
    writeLocalList('mount_accounts', nextAccounts)
  }, [accounts, transactions])

  const addAccount = useCallback((acc) => {
    const nextAccounts = [...accounts, acc]
    setAccounts(nextAccounts)
    writeLocalList('mount_accounts', nextAccounts)
  }, [accounts])

  const addGoal = useCallback((g) => {
    const nextGoals = [...goals, g]
    setGoals(nextGoals)
    writeLocalList('mount_goals', nextGoals)
  }, [goals])

  const updateGoal = useCallback((g) => {
    const nextGoals = goals.map(goal => goal.id === g.id ? { ...goal, savedAmount: g.savedAmount } : goal)
    setGoals(nextGoals)
    writeLocalList('mount_goals', nextGoals)
  }, [goals])

  const restoreDemoData = useCallback(() => {
    resetDemoData()
    setAccounts(readLocalList('mount_accounts', []))
    setTransactions(readLocalList('mount_transactions', []))
    setGoals(readLocalList('mount_goals', []))
    setDemoMode(true)
    localStorage.setItem(DEMO_MODE_KEY, 'true')
  }, [])

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
      {demoMode && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 10, padding: '12px 16px 0' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', borderRadius: 999, padding: '4px 10px', background: '#E8F5F0', color: '#1A3D30', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Demo Data
          </span>
          <button
            type="button"
            onClick={restoreDemoData}
            style={{ border: '1px solid #D8F3DC', background: '#fff', borderRadius: 999, padding: '6px 10px', color: '#1A3D30', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Reset demo
          </button>
        </div>
      )}

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
          </div>
        )}
        {mobileTab === 'budget' && (
          <div style={{ paddingBottom: 24 }}>
            <BudgetPanel transactions={transactions} rate={rate} />
            <div style={{ height: 16 }} />
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
          <FXGraph />
        )}
        {desktopTab === 'Budget' && (
          <>
            <BudgetPanel transactions={transactions} rate={rate} />
            <div style={{ height: 16 }} />
            <GoalsPanel goals={goals} accounts={accounts} onAdd={addGoal} onUpdate={updateGoal} />
          </>
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
