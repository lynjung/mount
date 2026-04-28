import { useState, useEffect, useRef } from 'react'

const RANGES = ['1D', '1W', '1M']

function getRangeStart(range) {
  const d = new Date()
  if (range === '1D') d.setDate(d.getDate() - 1)
  else if (range === '1W') d.setDate(d.getDate() - 7)
  else d.setMonth(d.getMonth() - 1)
  return d.toISOString().slice(0, 10)
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

export function FXGraph() {
  const [range, setRange] = useState('1M')
  const [points, setPoints] = useState([])
  const [loading, setLoading] = useState(false)
  const canvasRef = useRef(null)

  useEffect(() => {
    setLoading(true)
    const start = getRangeStart(range)
    const end = todayStr()
    fetch(`https://api.frankfurter.app/${start}..${end}?from=USD&to=KRW`)
      .then(r => r.json())
      .then(data => {
        const pts = Object.entries(data.rates || {})
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, val]) => ({ date, rate: val.KRW }))
        setPoints(pts)
      })
      .catch(e => console.error('FX history error:', e))
      .finally(() => setLoading(false))
  }, [range])

  useEffect(() => {
    if (!points.length) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    const W = canvas.offsetWidth
    const H = canvas.offsetHeight
    canvas.width = W * dpr
    canvas.height = H * dpr
    ctx.scale(dpr, dpr)

    const rates = points.map(p => p.rate)
    const min = Math.min(...rates)
    const max = Math.max(...rates)
    const pad = { top: 12, bottom: 12, left: 4, right: 4 }
    const chartW = W - pad.left - pad.right
    const chartH = H - pad.top - pad.bottom

    const x = (i) => pad.left + (i / (points.length - 1)) * chartW
    const y = (r) => pad.top + (1 - (r - min) / (max - min || 1)) * chartH

    const isUp = rates[rates.length - 1] >= rates[0]
    const lineColor = isUp ? '#52B788' : '#E63946'
    const fillColor = isUp ? 'rgba(82,183,136,0.12)' : 'rgba(230,57,70,0.10)'

    ctx.clearRect(0, 0, W, H)

    // Fill area
    ctx.beginPath()
    ctx.moveTo(x(0), y(rates[0]))
    points.forEach((p, i) => ctx.lineTo(x(i), y(p.rate)))
    ctx.lineTo(x(points.length - 1), H - pad.bottom)
    ctx.lineTo(x(0), H - pad.bottom)
    ctx.closePath()
    ctx.fillStyle = fillColor
    ctx.fill()

    // Line
    ctx.beginPath()
    ctx.moveTo(x(0), y(rates[0]))
    points.forEach((p, i) => ctx.lineTo(x(i), y(p.rate)))
    ctx.strokeStyle = lineColor
    ctx.lineWidth = 2
    ctx.lineJoin = 'round'
    ctx.stroke()
  }, [points])

  const first = points[0]?.rate
  const last = points[points.length - 1]?.rate
  const pct = first && last ? (((last - first) / first) * 100).toFixed(2) : null
  const isUp = pct !== null && parseFloat(pct) >= 0

  return (
    <div style={{ padding: '16px 16px 0' }}>
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8F5F0', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '14px 16px 10px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 10, color: '#7A9E8E', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 4 }}>
              USD → KRW
            </div>
            <div style={{ fontSize: 20, fontWeight: 600, color: '#0E1F1A', letterSpacing: '-0.5px' }}>
              {last ? `₩${Math.round(last).toLocaleString('ko-KR')}` : '—'}
            </div>
            {pct !== null && (
              <div style={{
                display: 'inline-block', marginTop: 4,
                fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                background: isUp ? '#D8F3DC' : '#FFE5E7',
                color: isUp ? '#1A3D30' : '#9B2226',
              }}>
                {isUp ? '▲' : '▼'} {Math.abs(pct)}%
              </div>
            )}
          </div>

          {/* Range toggle */}
          <div style={{ display: 'flex', gap: 4 }}>
            {RANGES.map(r => (
              <button key={r} onClick={() => setRange(r)} style={{
                fontSize: 11, fontWeight: 500, padding: '4px 10px', borderRadius: 8,
                border: `1px solid ${range === r ? '#1A3D30' : '#E8F5F0'}`,
                background: range === r ? '#1A3D30' : 'transparent',
                color: range === r ? '#E8F5F0' : '#7A9E8E',
                cursor: 'pointer', fontFamily: 'inherit',
              }}>
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Canvas */}
        <div style={{ height: 100, position: 'relative' }}>
          {loading && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#7A9E8E' }}>
              Loading…
            </div>
          )}
          <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
        </div>
      </div>
    </div>
  )
}
