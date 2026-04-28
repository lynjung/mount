import { useState, useEffect } from 'react'

const CACHE_KEY = 'mount_fx_cache'
const TTL = 60 * 60 * 1000

export function useExchangeRate() {
  const [rate, setRate] = useState(null)

  useEffect(() => {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null')
    if (cached && Date.now() - cached.timestamp < TTL) {
      setRate(cached.rate)
      return
    }
    fetch('https://api.exchangerate-api.com/v4/latest/USD')
      .then(r => r.json())
      .then(d => {
        const rate = d.rates.KRW
        localStorage.setItem(CACHE_KEY, JSON.stringify({ rate, timestamp: Date.now() }))
        setRate(rate)
      })
      .catch(e => console.error('FX fetch error:', e))
  }, [])

  return rate
}
