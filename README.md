# Mount

Mount is a mobile-first personal finance tracker built for everyday budgeting, multi-currency visibility, and quick financial planning. It is intentionally designed as a local-first app: most state lives in browser localStorage, so it works without auth, database setup, or a server backend.

## Live URL

This repository does not include a committed production domain. Deploy the app in Vercel and use the project’s generated Vercel URL (for example, your-project-name.vercel.app) as the live URL. There is no required Clerk domain or authentication flow for normal app usage.

## Why this app does not require authentication

The finance tracker is a front-end-only experience and does not depend on a logged-in user identity to function. Account balances, transaction history, goals, and settings are stored under browser-local keys such as `mount_accounts`, `mount_transactions`, `mount_goals`, and `mount_settings`.

A previous Clerk integration was causing the Vercel site to stop at a permanent Loading state because it was waiting on a missing or misconfigured auth provider. The app now renders without any auth requirement and is safe to run in a static deployment.

## Features

- Dashboard with total balance, monthly income, expenses, and net cash flow
- Multi-account tracking for bank, cash, credit, investment, loan, and other account types
- USD/KRW conversions and exchange-rate-based totals
- Transaction search, account filtering, category filtering, and type filtering
- Calendar view for daily income and expense totals
- FX trend graph for USD to KRW using Frankfurter data
- Savings goals with progress bars and target-date tracking
- AI budget suggestions via Gemini when a key is configured
- Empty-state onboarding for adding the first account
- Responsive layout tuned for mobile and desktop

## Architecture

- Frontend: React + Vite
- Styling: plain CSS with inline styles and component-level design tokens
- State persistence: browser localStorage
- Data model: seeded defaults in `src/utils/seedData.js`
- External APIs:
  - `https://api.frankfurter.dev/v1/latest?from=USD&to=KRW`
  - `https://api.frankfurter.dev/v1/{start}..{end}?from=USD&to=KRW`
  - `https://api.exchangerate-api.com/v4/latest/USD`
  - Optional Gemini API for AI budget generation

## Project structure

- `src/App.jsx` – app shell and local state management
- `src/components/` – dashboard, account, transaction, budget, goals, calendar, and UI primitives
- `src/hooks/` – FX rate and AI budget hooks
- `src/utils/` – currency helpers, category metadata, seed data, and formatting utilities
- `api/` – legacy serverless endpoints retained as optional, non-authenticated placeholders; not required for the main app
- `public/manifest.json` – PWA manifest
- `vercel.json` – Vercel config

## Setup

1. Install dependencies:
   npm install
2. Start the dev server:
   npm run dev
3. Open the Vite URL in the terminal output, usually `http://localhost:5173/`
4. Build for production:
   npm run build

## Environment variables

The app does not require auth or secrets for the default local-only experience.

Optional variables:

- `VITE_GEMINI_API_KEY` – enables the AI budget generator in the UI
- `GEMINI_API_KEY` – used by the serverless budget endpoint when calling Gemini
- `DATABASE_URL` – only needed if you later re-enable the legacy database-backed API routes
- `CRON_SECRET` – only needed for scheduled recurring-job protection in the optional API cron route

Example `.env.local`:

```bash
VITE_GEMINI_API_KEY=your_key_here
GEMINI_API_KEY=your_key_here
DATABASE_URL=postgres://user:password@host:5432/db
CRON_SECRET=replace-with-random-secret
```

Do not commit secrets or real production credentials to Git.

## Development notes

- The default experience is intentionally local-first and does not depend on Clerk, Firebase, or a custom authentication backend.
- To reset the app data, clear the browser localStorage keys for the project or remove the `mount_*` entries from DevTools.
- Data is seeded on first load when no prior localStorage values exist.

## Deployment

The repository is compatible with a static Vercel deployment because the app renders entirely on the client. There is no required authenticated login flow, and no Clerk environment variables are needed for the production app to load.

If you later want to restore database-backed APIs, add the required environment variables in the Vercel dashboard and make sure the API routes are configured to fail safely when they are not available.
