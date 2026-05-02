import type { Currency } from '../types'

export const fmtUSD = (n: number): string =>
  (n < 0 ? '−$' : '$') + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export const fmtKRW = (n: number): string =>
  (n < 0 ? '−₩' : '₩') + Math.round(Math.abs(n)).toLocaleString('ko-KR')

export const toUSD = (amt: number, cur: Currency, rate: number): number =>
  cur === 'USD' ? amt : amt / rate

export const toKRW = (amt: number, cur: Currency, rate: number): number =>
  cur === 'KRW' ? amt : amt * rate

export const fmt = (amt: number, cur: Currency): string =>
  cur === 'KRW' ? fmtKRW(amt) : fmtUSD(amt)
