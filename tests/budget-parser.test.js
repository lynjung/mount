import test from 'node:test'
import assert from 'node:assert/strict'

import {
  BUDGET_KEYS,
  sanitizeBudgetValue,
  normalizeBudgetObject,
  buildDeterministicFallback,
} from '../api/budget.js'

test('preserves decimal values from plain numeric strings', () => {
  assert.equal(sanitizeBudgetValue('146.54'), 146.54)
  assert.equal(sanitizeBudgetValue('146.54 '), 146.54)
})

test('accepts currency and comma formatting', () => {
  assert.equal(sanitizeBudgetValue('$146.54'), 146.54)
  assert.equal(sanitizeBudgetValue('1,234.56'), 1234.56)
})

test('rejects malformed or extreme values', () => {
  assert.equal(sanitizeBudgetValue('abc'), null)
  assert.equal(sanitizeBudgetValue('-5'), null)
  assert.equal(sanitizeBudgetValue('9999999'), null)
})

test('normalizes valid structured output without stripping decimals', () => {
  const normalized = normalizeBudgetObject({
    food: '146.54',
    transport: '$145.13',
    shopping: '1,320.63',
    utilities: '200.00',
    entertainment: '100.25',
  }, {
    food: 146.54,
    transport: 145.13,
    shopping: 320.63,
    utilities: 150,
    entertainment: 100,
  })

  assert.deepEqual(normalized, {
    food: 146.54,
    transport: 145.13,
    shopping: 1320.63,
    utilities: 200,
    entertainment: 100.25,
  })
})

test('falls back deterministically for malformed data', () => {
  const fallback = normalizeBudgetObject({
    food: 'bad',
    transport: '-10',
    shopping: '999999',
    utilities: 'hello',
    entertainment: '1,000',
  }, {
    food: 120,
    transport: 90,
    shopping: 70,
    utilities: 50,
    entertainment: 60,
  })

  assert.deepEqual(fallback, buildDeterministicFallback({
    food: 120,
    transport: 90,
    shopping: 70,
    utilities: 50,
    entertainment: 60,
  }))
  assert.ok(BUDGET_KEYS.every(key => Object.hasOwn(fallback, key)))
})
