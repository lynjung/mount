export function centsToUsd(cents) {
  if (!Number.isFinite(Number(cents))) return 0
  return Number((Number(cents) / 100).toFixed(2))
}

export function formatUsdFromCents(cents) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(centsToUsd(cents))
}

export function getBudgetProgressPercent(spent, limitCents) {
  const parsedSpent = Number(spent)
  const parsedLimitCents = Number(limitCents)
  const limitUsd = centsToUsd(parsedLimitCents)
  if (!Number.isFinite(parsedSpent) || !Number.isFinite(parsedLimitCents) || limitUsd <= 0) return 0
  return Number(((parsedSpent / limitUsd) * 100).toFixed(2))
}
