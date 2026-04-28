# Mount — Project Brief

## What is Mount?
Personal finance web app for managing money across multiple currencies (USD/KRW). Name from Korean phrase 티끌 모아 태산 ("every penny counts"). Built as a PWA — mobile-first, deployable on Vercel.

---

## Tech Stack
- React + Vite
- Plain CSS (no Tailwind)
- localStorage (no backend, no auth)
- Exchange rates: https://api.exchangerate-api.com/v4/latest/USD
- Historical FX: https://api.frankfurter.app/
- AI budget: Google Gemini API (gemini-2.0-flash, free tier)
- Deploy: Vercel

---

## Design Tokens

### Colors
#0E1F1A  hero background (dark forest)
#1A3D30  primary brand, buttons
#2A5C48  forest mid
#2D6A4F  forest light / active
#52B788  success / income accent
#95D5B2  light green
#D8F3DC  green tint
#E8F5F0  lightest green surface
#4A6B5C  sage dark
#7A9E8E  sage mid
#9B2226  expense red dark
#E63946  expense red mid
#F0F4F2  mist surface
#F8FAF9  mist background
#D4A017  amber warning

### Typography
- Font: Inter (Google Fonts)
- Hero balance: 32-36px, weight 500, letter-spacing -1.5px
- Section heading: 13px, weight 500
- Body: 13px, weight 400
- Meta: 10-11px
- Micro uppercase: 10px, letter-spacing 0.07em

### Logo
const Logo = ({ dark = false }) => (
  <svg width="22" height="22" viewBox="0 0 26 26" fill="none">
    <polygon points="13,4 22,20 4,20" fill={dark ? '#52B788' : '#1A3D30'} opacity="0.15"/>
    <polygon points="13,4 22,20 13,20" fill={dark ? '#52B788' : '#1A3D30'} opacity="0.35"/>
    <polygon points="7,13 16,20 4,20" fill={dark ? '#52B788' : '#1A3D30'} opacity="0.6"/>
    <polygon points="7,13 16,20 7,20" fill={dark ? '#52B788' : '#1A3D30'}/>
  </svg>
)

---

## Data Models (localStorage)

// Key: mount_accounts
[{
  id: string,        // crypto.randomUUID()
  name: string,      // "Kakao Bank"
  type: 'bank' | 'credit' | 'cash' | 'investment' | 'loan' | 'other',
  currency: string,  // 'USD' | 'KRW'
  balance: number,   // negative for credit/loan
  color: string,     // hex
  createdAt: string  // ISO
}]

// Key: mount_transactions
[{
  id: string,
  accountId: string,
  name: string,
  amount: number,    // always positive
  type: 'expense' | 'income',
  currency: string,
  category: 'food' | 'transport' | 'shopping' | 'utilities' | 'entertainment' | 'income' | 'transfer' | 'other',
  date: string,      // 'YYYY-MM-DD'
  recurring: boolean,
  note: string
}]

// Key: mount_goals
[{ id, name, emoji, targetAmount, currency, savedAmount, accountId, targetDate, createdAt }]

// Key: mount_settings
{ displayCurrency, userName, userInitials }

// Key: mount_fx_cache
{ rate, timestamp }  // 1-hour TTL

---

## Screens

### Mobile — Bottom Nav (4 tabs)
- Home: Hero + Accounts grid + Recent transactions
- Calendar: Monthly grid with daily income/expense amounts
- Trends: Bar chart + FX graph + AI insight
- Profile: Settings + Goals + Account management

### Desktop — Top Tabs
Transactions | Calendar | Trends | Budget | Goals | Account Colors

---

## Component Specs

### Hero (background: #0E1F1A)
- Total balance in display currency
- Equivalent in other currency below
- Income / Expenses / Net stats for current month
- Currency toggle uses useState — NEVER hardcoded:

const [currency, setCurrency] = useState('usd')

<div style={{ display: 'flex', gap: 4 }}>
  {['usd', 'krw'].map(c => (
    <div key={c} onClick={() => setCurrency(c)} style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 11, fontWeight: 500, padding: '5px 14px', borderRadius: 20,
      cursor: 'pointer', userSelect: 'none',
      background: currency === c ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.07)',
      color: currency === c ? '#E8F5F0' : 'rgba(232,245,240,0.45)',
      border: `1px solid ${currency === c ? 'rgba(255,255,255,0.36)' : 'rgba(255,255,255,0.12)'}`,
    }}>{c === 'usd' ? '$ USD' : '₩ KRW'}</div>
  ))}
</div>

### useExchangeRate Hook
const CACHE_KEY = 'mount_fx_cache'
const TTL = 60 * 60 * 1000

export function useExchangeRate() {
  const [rate, setRate] = useState(null)
  useEffect(() => {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null')
    if (cached && Date.now() - cached.timestamp < TTL) {
      setRate(cached.rate); return
    }
    fetch('https://api.exchangerate-api.com/v4/latest/USD')
      .then(r => r.json())
      .then(d => {
        const rate = d.rates.KRW
        localStorage.setItem(CACHE_KEY, JSON.stringify({ rate, timestamp: Date.now() }))
        setRate(rate)
      })
  }, [])
  return rate
}

### currency.js Utils
export const fmtUSD = n => (n < 0 ? '−$' : '$') + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
export const fmtKRW = n => (n < 0 ? '−₩' : '₩') + Math.round(Math.abs(n)).toLocaleString('ko-KR')
export const toUSD = (amt, cur, rate) => cur === 'usd' ? amt : amt / rate
export const toKRW = (amt, cur, rate) => cur === 'krw' ? amt : amt * rate
export const fmt = (amt, cur) => cur === 'krw' ? fmtKRW(amt) : fmtUSD(amt)

### Accounts Grid
- 2x2 mobile, 4-col desktop
- Card: 2px color stripe top, name, native balance, converted amount
- Tap → edit modal

### Add Account Flow (multi-step modal)
1. Pick type (Bank Account / Credit Card / Cash / Investment / Loan / Other)
2. Enter name, opening balance, currency
3. Pick color (ColorPicker component)
4. Live preview updates as user types

### Transactions
- Search + filter by account, category, date range, type
- Income: green, + prefix. Expense: red, − prefix
- Recurring: pill badge
- Add modal: name, amount, currency, account, category, date, recurring toggle, note

### Calendar View
- 7-column monthly grid
- FIXED cell height: 40px mobile, 62px desktop, overflow:hidden — no exceptions
- Days with transactions show:
  - +$800 in green (total income that day)
  - −$24 in red (total expenses that day)
  - Font 7.5-9px, ellipsis truncate
- Tap day → transaction list below
- Today: 1px border #2D6A4F
- Selected: bg #E8F5F0, border #1A3D30

### FX Graph (canvas)
- Frankfurter: https://api.frankfurter.app/{start}..{end}?from=USD&to=KRW
- Toggle: 1D / 1W / 1M
- Canvas line — green if rate up, red if down
- Header: current rate + % change pill

### Budget Panel (AI — Gemini)
// hooks/useAIBudget.js
import { useState } from 'react'

export function useAIBudget() {
  const [budget, setBudget] = useState(null)
  const [loading, setLoading] = useState(false)

  const generate = async (transactions) => {
    setLoading(true)
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Based on these transactions this month: ${JSON.stringify(transactions)}
Return ONLY valid JSON, no markdown formatting, no code fences, no explanation:
{ "food": number, "transport": number, "shopping": number, "utilities": number, "entertainment": number }
All values are suggested monthly budget limits in USD.`
            }]
          }]
        })
      })

      const data = await response.json()
      const text = data.candidates[0].content.parts[0].text
      const clean = text.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(clean)
      setBudget(parsed)
    } catch (e) {
      console.error('AI budget error:', e)
    } finally {
      setLoading(false)
    }
  }

  return { budget, loading, generate }
}

- Progress bar colors: green <75%, amber #D4A017 75-99%, red #E63946 100%+
- Warnings: "Almost at limit" (amber 75%+), "Over budget" (red 100%+)

### Goals Panel
- Card per goal: emoji + name, progress bar, saved/target, target date
- Bar: #1A3D30 normally, #52B788 when >90%
- "+ New Goal" dashed card at bottom

### Color Picker
export const PALETTES = {
  'Forest & Nature': ['#0E1F1A','#1A3D30','#2A5C48','#2D6A4F','#52B788','#95D5B2','#B7E4C7','#D8F3DC'],
  'Ocean & Sky':     ['#023E8A','#0077B6','#0096C7','#00B4D8','#48CAE4','#4361EE','#4CC9F0','#90E0EF'],
  'Warm & Earthy':   ['#7F4F24','#936639','#B08968','#DDA15E','#E76F51','#F4A261','#E9C46A','#FEFAE0'],
  'Bold & Vivid':    ['#9B2226','#AE2012','#E63946','#C77DFF','#7B2FBE','#D4537E','#FF70A6','#FF9EBB'],
  'Neutral & Stone': ['#212529','#343A40','#495057','#6C757D','#ADB5BD','#6D6875','#B5838D','#E5989B'],
}
// 5 rows of 8 swatches, no group label text shown
// Selected: 2.5px border solid currentColor
// Below: hex text input validating /^#[0-9A-Fa-f]{6}$/
// Live preview card

### Empty State (no accounts)
- Hero: $0.00 in muted #4A6B5C
- 2x2 ghost placeholders (1px dashed border)
- Logo + "Welcome to Mount"
- "티끌 모아 태산 — every penny counts."
- "+ Add First Account" button (#1A3D30 / #E8F5F0, radius 20px)
- "Skip for now" text link

---

## PWA Setup

### index.html (in head)
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#0E1F1A">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<link rel="manifest" href="/manifest.json">

### public/manifest.json
{
  "name": "Mount",
  "short_name": "Mount",
  "description": "Track your money across currencies",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait",
  "theme_color": "#0E1F1A",
  "background_color": "#0E1F1A",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}

---

## Project Structure
mount/
├── index.html
├── .env                        VITE_GEMINI_API_KEY=AIza...
├── .gitignore                  must include .env
├── public/manifest.json
└── src/
    ├── main.jsx, App.jsx, index.css
    ├── components/
    │   Logo.jsx, Hero.jsx, AccountCard.jsx, AccountsGrid.jsx,
    │   AddAccountModal.jsx, ColorPicker.jsx, TransactionRow.jsx,
    │   TransactionList.jsx, AddTransactionModal.jsx, CalendarView.jsx,
    │   FXGraph.jsx, BudgetPanel.jsx, GoalsPanel.jsx, BottomNav.jsx, EmptyState.jsx
    ├── hooks/
    │   useLocalStorage.js, useExchangeRate.js, useAIBudget.js
    └── utils/
        currency.js, dates.js, categories.js

---

## Build Order
1. useLocalStorage hook + seed data
2. useExchangeRate hook
3. currency.js utils
4. categories.js (icon + color per category)
5. Logo component
6. Hero with useState currency toggle
7. AccountCard + AccountsGrid
8. BottomNav (mobile) + desktop tab shell in App.jsx
9. TransactionRow + TransactionList
10. AddTransactionModal
11. CalendarView
12. FXGraph (canvas)
13. ColorPicker
14. AddAccountModal
15. BudgetPanel + useAIBudget
16. GoalsPanel
17. EmptyState
18. PWA manifest + meta tags
19. Deploy to Vercel

---

## Non-Negotiable Rules
- No hardcoded data — everything reads/writes localStorage
- Currency toggle = useState — never inline static styles
- No raw floats on screen — always fmtUSD, fmtKRW, or toLocaleString
- Calendar cells = fixed height, overflow hidden, no exceptions
- Gemini key = VITE_GEMINI_API_KEY env var only, never hardcoded
- .env must be in .gitignore — never commit API keys
- Mobile first — 375px base, scale up at 768px+
- localStorage keys: mount_accounts, mount_transactions, mount_goals, mount_settings, mount_fx_cache