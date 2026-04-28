const today = new Date()
const yyyy = today.getFullYear()
const mm = String(today.getMonth() + 1).padStart(2, '0')

const d = (day) => `${yyyy}-${mm}-${String(day).padStart(2, '0')}`

export const SEED_ACCOUNTS = [
  {
    id: 'acc-1',
    name: 'Chase Checking',
    type: 'bank',
    currency: 'USD',
    balance: 3240.50,
    color: '#1A3D30',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'acc-2',
    name: 'Kakao Bank',
    type: 'bank',
    currency: 'KRW',
    balance: 1850000,
    color: '#FFD54F',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'acc-3',
    name: 'Chase Sapphire',
    type: 'credit',
    currency: 'USD',
    balance: -420.00,
    color: '#9B2226',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'acc-4',
    name: 'Cash Wallet',
    type: 'cash',
    currency: 'USD',
    balance: 85.00,
    color: '#52B788',
    createdAt: new Date().toISOString(),
  },
]

export const SEED_TRANSACTIONS = [
  { id: 'tx-1',  accountId: 'acc-1', name: 'Salary',         amount: 4200,  type: 'income',  currency: 'USD', category: 'income',        date: d(1),  recurring: true,  note: '' },
  { id: 'tx-2',  accountId: 'acc-1', name: 'Netflix',        amount: 15.99, type: 'expense', currency: 'USD', category: 'entertainment',  date: d(3),  recurring: true,  note: '' },
  { id: 'tx-3',  accountId: 'acc-3', name: 'Grocery Run',    amount: 87.40, type: 'expense', currency: 'USD', category: 'food',           date: d(4),  recurring: false, note: 'Whole Foods' },
  { id: 'tx-4',  accountId: 'acc-2', name: '편의점',          amount: 8500,  type: 'expense', currency: 'KRW', category: 'food',           date: d(5),  recurring: false, note: 'GS25' },
  { id: 'tx-5',  accountId: 'acc-1', name: 'Uber',           amount: 12.50, type: 'expense', currency: 'USD', category: 'transport',      date: d(6),  recurring: false, note: '' },
  { id: 'tx-6',  accountId: 'acc-3', name: 'Amazon',         amount: 63.20, type: 'expense', currency: 'USD', category: 'shopping',       date: d(8),  recurring: false, note: 'Phone case + charger' },
  { id: 'tx-7',  accountId: 'acc-1', name: 'Electric Bill',  amount: 95.00, type: 'expense', currency: 'USD', category: 'utilities',      date: d(10), recurring: true,  note: '' },
  { id: 'tx-8',  accountId: 'acc-2', name: '지하철',          amount: 14500, type: 'expense', currency: 'KRW', category: 'transport',      date: d(11), recurring: false, note: 'Monthly T-money' },
  { id: 'tx-9',  accountId: 'acc-1', name: 'Freelance',      amount: 800,   type: 'income',  currency: 'USD', category: 'income',        date: d(12), recurring: false, note: 'Design project' },
  { id: 'tx-10', accountId: 'acc-3', name: 'Dinner out',     amount: 54.80, type: 'expense', currency: 'USD', category: 'food',           date: d(14), recurring: false, note: 'Italian place' },
  { id: 'tx-11', accountId: 'acc-2', name: '카페',            amount: 6000,  type: 'expense', currency: 'KRW', category: 'food',           date: d(15), recurring: false, note: '스타벅스' },
  { id: 'tx-12', accountId: 'acc-1', name: 'Spotify',        amount: 9.99,  type: 'expense', currency: 'USD', category: 'entertainment',  date: d(16), recurring: true,  note: '' },
  { id: 'tx-13', accountId: 'acc-4', name: 'Lunch',          amount: 11.50, type: 'expense', currency: 'USD', category: 'food',           date: d(18), recurring: false, note: '' },
  { id: 'tx-14', accountId: 'acc-2', name: '온라인쇼핑',      amount: 32000, type: 'expense', currency: 'KRW', category: 'shopping',       date: d(19), recurring: false, note: 'Coupang' },
  { id: 'tx-15', accountId: 'acc-1', name: 'Internet',       amount: 60.00, type: 'expense', currency: 'USD', category: 'utilities',      date: d(20), recurring: true,  note: '' },
]

export const SEED_GOALS = [
  {
    id: 'goal-1',
    name: 'Emergency Fund',
    emoji: '🛡️',
    targetAmount: 10000,
    currency: 'USD',
    savedAmount: 3240.50,
    accountId: 'acc-1',
    targetDate: `${yyyy + 1}-06-01`,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'goal-2',
    name: 'Korea Trip',
    emoji: '✈️',
    targetAmount: 3000,
    currency: 'USD',
    savedAmount: 800,
    accountId: 'acc-1',
    targetDate: `${yyyy + 1}-12-01`,
    createdAt: new Date().toISOString(),
  },
]

export const SEED_SETTINGS = {
  displayCurrency: 'usd',
  userName: '',
  userInitials: '',
}

export function seedIfEmpty() {
  if (!localStorage.getItem('mount_accounts')) {
    localStorage.setItem('mount_accounts', JSON.stringify(SEED_ACCOUNTS))
  }
  if (!localStorage.getItem('mount_transactions')) {
    localStorage.setItem('mount_transactions', JSON.stringify(SEED_TRANSACTIONS))
  }
  if (!localStorage.getItem('mount_goals')) {
    localStorage.setItem('mount_goals', JSON.stringify(SEED_GOALS))
  }
  if (!localStorage.getItem('mount_settings')) {
    localStorage.setItem('mount_settings', JSON.stringify(SEED_SETTINGS))
  }
}
