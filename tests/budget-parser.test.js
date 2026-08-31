import test from 'node:test'
import assert from 'node:assert/strict'

import {
  BUDGET_KEYS,
  normalizeBudgetResponse,
  defaultBudgetFallback,
} from '../api/budget.js'
import {
  centsToUsd,
  formatUsdFromCents,
  getBudgetProgressPercent,
} from '../src/utils/budget.js'

test('parses a cents-based contract and preserves exact cent values', () => {
  const normalized = normalizeBudgetResponse({
    recommendedLimitCents: {
      food: 14654,
      transport: 14513,
      shopping: 32063,
      utilities: 15500,
      entertainment: 2600,
    },
  })

  assert.deepEqual(normalized, {
    recommendedLimitCents: {
      food: 14654,
      transport: 14513,
      shopping: 32063,
      utilities: 15500,
      entertainment: 2600,
    },
  })
})

test('accepts USD decimal values and converts to cents exactly once', () => {
  const normalized = normalizeBudgetResponse({
    recommendedLimitUsd: {
      food: 146.54,
      transport: 145.13,
      shopping: 320.63,
      utilities: 155,
      entertainment: 26,
    },
  })

  assert.deepEqual(normalized, {
    recommendedLimitCents: {
      food: 14654,
      transport: 14513,
      shopping: 32063,
      utilities: 15500,
      entertainment: 2600,
    },
  })
})

test('rejects malformed or extreme values by falling back to a safe budget object', () => {
  assert.deepEqual(normalizeBudgetResponse({ recommendedLimitCents: { food: 'abc' } }), defaultBudgetFallback({}))
  assert.deepEqual(normalizeBudgetResponse({ recommendedLimitCents: { food: -5 } }), defaultBudgetFallback({}))
  assert.deepEqual(normalizeBudgetResponse({ recommendedLimitCents: { food: 999999999 } }), defaultBudgetFallback({}))
})

test('falls back deterministically when validation fails', () => {
  const fallback = normalizeBudgetResponse({
    recommendedLimitCents: { food: 'bad', transport: -10, shopping: 999999999, utilities: 'hello', entertainment: 2600 },
  }, {
    food: 120,
    transport: 90,
    shopping: 70,
    utilities: 50,
    entertainment: 60,
  })
  assert.deepEqual(fallback, defaultBudgetFallback({
    food: 120,
    transport: 90,
    shopping: 70,
    utilities: 50,
    entertainment: 60,
  }))
  assert.ok(BUDGET_KEYS.every(key => Object.hasOwn(fallback.recommendedLimitCents, key)))
})

test('14654 cents renders as $146.54 and progress is correct', () => {
  assert.equal(formatUsdFromCents(14654), '$146.54')
  assert.equal(getBudgetProgressPercent(60, 14654), 40.94)
})

test('rejects implausible integer-like USD values when summary is small', () => {
  // Simulate Gemini returning large integer USD-like numbers (likely misformatted cents).
  // With no summary (or small spending), the server should fall back to a safe budget.
  const normalized = normalizeBudgetResponse({
    recommendedLimitUsd: {
      food: 14654,
      transport: 14513,
      shopping: 32063,
      utilities: 15500,
      entertainment: 2600,
    },
  }, {})

  assert.deepEqual(normalized, defaultBudgetFallback({}))
})

test('evidence: raw Gemini text -> server parse -> frontend JSON -> persisted payload', () => {
  // Use correct, decimal USD values and a summary large enough to allow acceptance.
  const rawJson = JSON.stringify({
    recommendedLimitUsd: {
      food: 146.54,
      transport: 145.13,
      shopping: 320.63,
      utilities: 155,
      entertainment: 26,
    },
  })

  const rawGemini = {
    candidates: [
      { content: { parts: [{ text: rawJson }] } },
    ],
  }

  // 1) Raw Gemini response (capture)
  const extractedText = rawGemini?.candidates?.[0]?.content?.parts?.[0]?.text
  assert.equal(extractedText, rawJson)

  // 2) Parsed server response (what the server would JSON.parse)
  const parsedCandidate = JSON.parse(extractedText)
  assert.deepEqual(parsedCandidate, {
    recommendedLimitUsd: {
      food: 146.54,
      transport: 145.13,
      shopping: 320.63,
      utilities: 155,
      entertainment: 26,
    },
  })

  // Provide a summary that represents monthly spending sufficient to allow totals
  const summary = { food: 120, transport: 100, shopping: 200, utilities: 150, entertainment: 50 }

  // 3) Server-normalized response returned by /api/budget (should accept decimals)
  const serverNormalized = normalizeBudgetResponse(parsedCandidate, summary)
  assert.deepEqual(serverNormalized, {
    recommendedLimitCents: {
      food: 14654,
      transport: 14513,
      shopping: 32063,
      utilities: 15500,
      entertainment: 2600,
    },
  })

  // 4) JSON received by frontend equals server response; persisted object uses cache shape
  const persisted = JSON.stringify({ version: 3, budget: serverNormalized })
  const parsedPersisted = JSON.parse(persisted)
  assert.equal(parsedPersisted.version, 3)
  assert.deepEqual(parsedPersisted.budget, serverNormalized)
})

test('regressions: accept currency-formatted strings and reject negatives/extremes', () => {
  const summary = { food: 120, transport: 100, shopping: 200, utilities: 150, entertainment: 50 }

  // accept string with dollar sign
  const s1 = normalizeBudgetResponse({ recommendedLimitUsd: { food: '$146.54', transport: 145.13, shopping: 320.63, utilities: 155, entertainment: 26 } }, summary)
  assert.deepEqual(s1, { recommendedLimitCents: { food: 14654, transport: 14513, shopping: 32063, utilities: 15500, entertainment: 2600 } })

  // accept comma-formatted number
  const s2 = normalizeBudgetResponse({ recommendedLimitUsd: { food: '1,234.56', transport: 0, shopping: 0, utilities: 0, entertainment: 0 } }, { food: 5000, transport: 0, shopping: 0, utilities: 0, entertainment: 0 })
  assert.deepEqual(s2, { recommendedLimitCents: { food: 123456, transport: 0, shopping: 0, utilities: 0, entertainment: 0 } })

  // reject negative values
  assert.deepEqual(normalizeBudgetResponse({ recommendedLimitUsd: { food: -5, transport: 0, shopping: 0, utilities: 0, entertainment: 0 } }, summary), defaultBudgetFallback(summary))

  // reject extreme values beyond max reasonable limit
  assert.deepEqual(normalizeBudgetResponse({ recommendedLimitUsd: { food: 999999999, transport: 0, shopping: 0, utilities: 0, entertainment: 0 } }, summary), defaultBudgetFallback(summary))
})

test('integer USD values are treated as dollars (not inferred cents) but validated against summary', () => {
  // large integer USD value; with a large summary this should be accepted as dollars
  const summary = { food: 20000, transport: 0, shopping: 0, utilities: 0, entertainment: 0 }
  const normalized = normalizeBudgetResponse({ recommendedLimitUsd: { food: 14654, transport: 0, shopping: 0, utilities: 0, entertainment: 0 } }, summary)
  assert.deepEqual(normalized, { recommendedLimitCents: { food: 1465400, transport: 0, shopping: 0, utilities: 0, entertainment: 0 } })
})


