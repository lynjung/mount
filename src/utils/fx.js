export function calculatePercentChange(points) {
  if (!Array.isArray(points) || points.length < 2) return 0

  const first = Number(points[0]?.rate)
  const last = Number(points[points.length - 1]?.rate)

  if (!Number.isFinite(first) || !Number.isFinite(last) || first === 0) return 0

  return Number((((last - first) / first) * 100).toFixed(2))
}
