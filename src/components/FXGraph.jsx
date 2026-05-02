import { useState, useEffect, useRef, useCallback } from 'react'

const RANGES = ['1W', '1M', '3M', '1Y']

function getRangeStart(range) {
  const d = new Date()
  if (range === '1W') d.setDate(d.getDate() - 7)
  else if (range === '1M') d.setMonth(d.getMonth() - 1)
  else if (range === '3M') d.setMonth(d.getMonth() - 3)
  else if (range === '1Y') d.setFullYear(d.getFullYear() - 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function niceYTicks(min, max, count = 4) {
  const range = max - min || 1
  // Pick a step that's a "nice" number (1, 2, 5, 10, 20, 50, 100…)
  const rawStep = range / count
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)))
  const normalized = rawStep / magnitude
  const nice = normalized < 1.5 ? 1 : normalized < 3.5 ? 2 : normalized < 7.5 ? 5 : 10
  const step = nice * magnitude

  const yMin = Math.floor(min / step) * step
  const yMax = Math.ceil(max / step) * step
  const ticks = []
  for (let v = yMin; v <= yMax + step * 0.01; v += step) ticks.push(Math.round(v))
  return ticks
}

export function FXGraph() {
  const [range, setRange] = useState('1M')
  const [points, setPoints] = useState([])
  const [loading, setLoading] = useState(false)
  const [tooltip, setTooltip] = useState(null)
  const [currentRate, setCurrentRate] = useState(null)

  useEffect(() => {
    fetch('https://api.frankfurter.dev/v1/latest?from=USD&to=KRW')
      .then(r => r.json())
      .then(data => setCurrentRate(data.rates?.KRW ?? null))
      .catch(() => {})
  }, [])
  const canvasRef = useRef(null)
  const overlayRef = useRef(null)
  const layoutRef = useRef(null)

  useEffect(() => {
    setLoading(true)
    const start = getRangeStart(range)
    const end = todayStr()
    fetch(`https://api.frankfurter.dev/v1/${start}..${end}?from=USD&to=KRW`)
      .then(r => r.json())
      .then(data => {
        const pts = Object.entries(data.rates || {})
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, val]) => ({ date, rate: val.KRW }))
          .filter(p => p.rate != null && isFinite(p.rate))
        setPoints(pts)
      })
      .catch(e => console.error('FX history error:', e))
      .finally(() => setLoading(false))
  }, [range])

  const drawChart = useCallback((pts) => {
    if (!pts.length) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    const W = canvas.offsetWidth
    const H = canvas.offsetHeight
    canvas.width = W * dpr
    canvas.height = H * dpr
    ctx.scale(dpr, dpr)

    const rates = pts.map(p => p.rate)
    const min = Math.min(...rates)
    const max = Math.max(...rates)
    const yTicks = niceYTicks(min, max, 4)
    const yMin = yTicks[0]
    const yMax = yTicks[yTicks.length - 1]

    const pad = { top: 16, bottom: 30, left: 66, right: 32 }
    const chartW = W - pad.left - pad.right
    const chartH = H - pad.top - pad.bottom

    const xPos = (i) => pad.left + (i / (pts.length - 1 || 1)) * chartW
    const yPos = (r) => pad.top + (1 - (r - yMin) / (yMax - yMin || 1)) * chartH

    const isUp = rates[rates.length - 1] >= rates[0]
    const lineColor = isUp ? '#52B788' : '#E63946'

    // store layout for hit-testing and overlay drawing
    layoutRef.current = { pad, chartW, chartH, xPos, yPos, pts, lineColor }
    const fillColor = isUp ? 'rgba(82,183,136,0.12)' : 'rgba(230,57,70,0.10)'
    const gridColor = '#E8F5F0'
    const labelColor = '#7A9E8E'

    ctx.clearRect(0, 0, W, H)

    // Grid lines + Y labels
    ctx.font = `11px -apple-system, sans-serif`
    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = labelColor
    yTicks.forEach(tick => {
      const yp = yPos(tick)
      ctx.strokeStyle = gridColor
      ctx.lineWidth = 1
      ctx.setLineDash([4, 4])
      ctx.beginPath()
      ctx.moveTo(pad.left, yp)
      ctx.lineTo(W - pad.right, yp)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.fillText(`₩${Math.round(tick).toLocaleString('ko-KR')}`, pad.left - 8, yp)
    })

    // X-axis date labels
    const xLabelCount = Math.min(pts.length, range === '1Y' ? 6 : range === '1W' ? 4 : 3)
    const step = Math.max(1, Math.floor((pts.length - 1) / (xLabelCount - 1)))
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillStyle = labelColor
    const labelY = H - pad.bottom + 6
    const labelFmt = (date) => new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    let lastDrawnX = -Infinity
    const minGap = 48
    for (let i = 0; i < pts.length; i += step) {
      const xp = xPos(i)
      if (xp - lastDrawnX >= minGap) {
        ctx.fillText(labelFmt(pts[i].date), xp, labelY)
        lastDrawnX = xp
      }
    }
    // always label last point if it won't collide
    const lastX = xPos(pts.length - 1)
    if (lastX - lastDrawnX >= minGap) {
      ctx.fillText(labelFmt(pts[pts.length - 1].date), lastX, labelY)
    }

    const chartBottom = pad.top + chartH

    // Fill area
    ctx.beginPath()
    ctx.moveTo(xPos(0), yPos(rates[0]))
    pts.forEach((p, i) => ctx.lineTo(xPos(i), yPos(p.rate)))
    ctx.lineTo(xPos(pts.length - 1), chartBottom)
    ctx.lineTo(xPos(0), chartBottom)
    ctx.closePath()
    ctx.fillStyle = fillColor
    ctx.fill()

    // Line
    ctx.beginPath()
    ctx.moveTo(xPos(0), yPos(rates[0]))
    pts.forEach((p, i) => ctx.lineTo(xPos(i), yPos(p.rate)))
    ctx.strokeStyle = lineColor
    ctx.lineWidth = 2
    ctx.lineJoin = 'round'
    ctx.stroke()
  }, [range])

  useEffect(() => {
    drawChart(points)
  }, [points, drawChart])

  const drawOverlay = useCallback((idx) => {
    const overlay = overlayRef.current
    if (!overlay) return
    const layout = layoutRef.current
    const dpr = window.devicePixelRatio || 1
    const W = overlay.offsetWidth
    const H = overlay.offsetHeight
    overlay.width = W * dpr
    overlay.height = H * dpr
    const ctx = overlay.getContext('2d')
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, W, H)
    if (idx == null || !layout) return

    const { pad, chartH, xPos, yPos, pts } = layout
    const pt = pts[idx]
    const xp = xPos(idx)
    const yp = yPos(pt.rate)
    const chartBottom = pad.top + chartH

    // Vertical line
    ctx.beginPath()
    ctx.moveTo(xp, pad.top)
    ctx.lineTo(xp, chartBottom)
    ctx.strokeStyle = 'rgba(14,31,26,0.15)'
    ctx.lineWidth = 1
    ctx.setLineDash([4, 3])
    ctx.stroke()
    ctx.setLineDash([])

    // Dot
    ctx.beginPath()
    ctx.arc(xp, yp, 4, 0, Math.PI * 2)
    ctx.fillStyle = '#fff'
    ctx.fill()
    ctx.strokeStyle = layout.lineColor
    ctx.lineWidth = 2
    ctx.stroke()
  }, [])

  const handleMouseMove = useCallback((e) => {
    const layout = layoutRef.current
    if (!layout) return
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const { pad, chartW, pts } = layout
    if (mouseX < pad.left || mouseX > pad.left + chartW) {
      setTooltip(null)
      drawOverlay(null)
      return
    }
    const frac = (mouseX - pad.left) / chartW
    const idx = Math.round(frac * (pts.length - 1))
    const clampedIdx = Math.max(0, Math.min(idx, pts.length - 1))
    const pt = pts[clampedIdx]
    const xp = layout.xPos(clampedIdx)
    setTooltip({ x: xp, pt })
    drawOverlay(clampedIdx)
  }, [drawOverlay])

  const handleMouseLeave = useCallback(() => {
    setTooltip(null)
    drawOverlay(null)
  }, [drawOverlay])

  const first = points[0]?.rate
  const last = points[points.length - 1]?.rate
  const isUp = first != null && last != null && last >= first
  const pct = first && last ? (((last - first) / first) * 100).toFixed(2) : null

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
              {currentRate ? `₩${Math.round(currentRate).toLocaleString('ko-KR')}` : '—'}
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
        <div style={{ height: 180, position: 'relative' }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {loading && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#7A9E8E' }}>
              Loading…
            </div>
          )}
          <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block', position: 'absolute', inset: 0 }} />
          <canvas ref={overlayRef} style={{ width: '100%', height: '100%', display: 'block', position: 'absolute', inset: 0, pointerEvents: 'none' }} />

          {/* Tooltip */}
          {tooltip && (
            <div style={{
              position: 'absolute',
              top: 10,
              left: Math.min(tooltip.x + 10, 9999),
              transform: tooltip.x > (canvasRef.current?.offsetWidth || 0) / 2 ? 'translateX(calc(-100% - 20px))' : 'none',
              background: '#0E1F1A',
              color: '#fff',
              borderRadius: 8,
              padding: '6px 10px',
              fontSize: 12,
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
            }}>
              <div style={{ fontWeight: 600 }}>₩{Math.round(tooltip.pt.rate).toLocaleString('ko-KR')}</div>
              <div style={{ opacity: 0.65, fontSize: 10, marginTop: 2 }}>
                {new Date(tooltip.pt.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
