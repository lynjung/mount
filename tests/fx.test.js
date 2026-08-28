import test from 'node:test'
import assert from 'node:assert/strict'

import { calculatePercentChange } from '../src/utils/fx.js'

test('calculatePercentChange uses the visible first and last points in the selected range', () => {
  const points = [
    { date: '2026-05-28', rate: 1502.83 },
    { date: '2026-08-28', rate: 1374.55 },
  ]

  assert.equal(calculatePercentChange(points), -8.54)
})

test('calculatePercentChange returns 0 when the range is empty', () => {
  assert.equal(calculatePercentChange([]), 0)
})
