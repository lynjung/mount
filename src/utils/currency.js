export const fmtUSD = n => (n < 0 ? '−$' : '$') + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
export const fmtKRW = n => (n < 0 ? '−₩' : '₩') + Math.round(Math.abs(n)).toLocaleString('ko-KR')
export const toUSD = (amt, cur, rate) => cur === 'USD' ? amt : amt / rate
export const toKRW = (amt, cur, rate) => cur === 'KRW' ? amt : amt * rate
export const fmt = (amt, cur) => cur === 'KRW' ? fmtKRW(amt) : fmtUSD(amt)
