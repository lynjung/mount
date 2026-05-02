import { useState, useEffect } from 'react'

const CACHE_KEY = 'mount_fx_cache'
const TTL = 60 * 60 * 1000

interface FXCache {
  rate: number
  timestamp: number
}

export function useExchangeRate(): number | null {
  const [rate, setRate] = useState<number | null>(null)

  useEffect(() => {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null') as FXCache | null
    if (cached && Date.now() - cached.timestamp < TTL) {
      setRate(cached.rate)
      return
    }
    fetch('https://api.exchangerate-api.com/v4/latest/USD')
      .then(r => r.json())
      .then((d: { rates: Record<string, number> }) => {
        const rate = d.rates.KRW
        localStorage.setItem(CACHE_KEY, JSON.stringify({ rate, timestamp: Date.now() }))
        setRate(rate)
      })
      .catch(e => console.error('FX fetch error:', e))
  }, [])

  return rate
}
