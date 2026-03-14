/**
 * Copyright (C) 2016-2026 Husain Alamri (H4n) and Xenolexia Foundation.
 * Licensed under the GNU Affero General Public License v3.0 (AGPL-3.0). See LICENSE.
 */

import { describe, it, expect } from 'vitest'
import {
  endOfDayUTC,
  scheduleAfterReview,
  initialSchedule,
  getDueCardIds,
  DEFAULT_SRS_CONFIG,
} from './srs'
import type { CardSchedule } from './types'

const MS_PER_DAY = 24 * 60 * 60 * 1000

describe('endOfDayUTC', () => {
  it('returns end of same UTC day for given timestamp', () => {
    // 2025-03-15 12:00:00.000 UTC
    const noon = new Date(Date.UTC(2025, 2, 15, 12, 0, 0, 0)).getTime()
    const end = endOfDayUTC(noon)
    expect(end).toBe(new Date(Date.UTC(2025, 2, 15, 23, 59, 59, 999)).getTime())
  })
})

describe('scheduleAfterReview', () => {
  const cardId = 'card-1'
  const now = new Date(Date.UTC(2025, 2, 15, 10, 0, 0, 0)).getTime()

  it('again on new card: next review in againIntervalMinutes', () => {
    const current = initialSchedule(cardId)
    const next = scheduleAfterReview('again', current, now)
    expect(next.cardId).toBe(cardId)
    expect(next.nextReviewAt).toBe(now + 10 * 60 * 1000)
    expect(next.step).toBe(0)
    expect(next.interval).toBe(10 * 60 * 1000)
  })

  it('good on new card: next review in initialIntervalDays', () => {
    const current = initialSchedule(cardId)
    const next = scheduleAfterReview('good', current, now)
    expect(next.nextReviewAt).toBe(now + MS_PER_DAY)
    expect(next.step).toBe(1)
    expect(next.interval).toBe(MS_PER_DAY)
  })

  it('easy on new card: next review in secondIntervalDays', () => {
    const current = initialSchedule(cardId)
    const next = scheduleAfterReview('easy', current, now)
    expect(next.nextReviewAt).toBe(now + 6 * MS_PER_DAY)
    expect(next.step).toBe(1)
  })

  it('good after first review (step 1): next review in secondIntervalDays', () => {
    const current: CardSchedule = {
      cardId,
      nextReviewAt: now,
      interval: MS_PER_DAY,
      easeFactor: 2.5,
      step: 1,
    }
    const next = scheduleAfterReview('good', current, now)
    expect(next.nextReviewAt).toBe(now + 6 * MS_PER_DAY)
    expect(next.step).toBe(2)
  })

  it('again resets step to 0', () => {
    const current: CardSchedule = {
      cardId,
      nextReviewAt: now,
      interval: MS_PER_DAY,
      easeFactor: 2.5,
      step: 2,
    }
    const next = scheduleAfterReview('again', current, now)
    expect(next.step).toBe(0)
    expect(next.nextReviewAt).toBe(now + 10 * 60 * 1000)
  })

  it('ease factor decreases on again (after step > 0)', () => {
    const current: CardSchedule = {
      cardId,
      nextReviewAt: now,
      interval: MS_PER_DAY,
      easeFactor: 2.5,
      step: 1,
    }
    const next = scheduleAfterReview('again', current, now)
    expect(next.easeFactor).toBe(2.5 + DEFAULT_SRS_CONFIG.easeDelta.again)
  })

  it('ease factor does not go below minEaseFactor', () => {
    const current: CardSchedule = {
      cardId,
      nextReviewAt: now,
      interval: MS_PER_DAY,
      easeFactor: 1.35,
      step: 1,
    }
    const next = scheduleAfterReview('again', current, now)
    expect(next.easeFactor).toBeGreaterThanOrEqual(DEFAULT_SRS_CONFIG.minEaseFactor)
  })
})

describe('getDueCardIds', () => {
  // 2025-03-15 14:00:00 UTC → end of day = 2025-03-15 23:59:59.999 UTC
  const now = new Date(Date.UTC(2025, 2, 15, 14, 0, 0, 0)).getTime()
  const endOfDay = new Date(Date.UTC(2025, 2, 15, 23, 59, 59, 999)).getTime()

  it('includes cards with nextReviewAt null (new cards)', () => {
    const schedules: CardSchedule[] = [
      { cardId: 'new-1', nextReviewAt: null, interval: 0, easeFactor: 2.5, step: 0 },
    ]
    expect(getDueCardIds(schedules, now)).toEqual(['new-1'])
  })

  it('includes cards with nextReviewAt <= end of today', () => {
    const schedules: CardSchedule[] = [
      { cardId: 'due-1', nextReviewAt: now - 1000, interval: 1, easeFactor: 2.5, step: 1 },
      { cardId: 'due-2', nextReviewAt: endOfDay, interval: 1, easeFactor: 2.5, step: 1 },
    ]
    expect(getDueCardIds(schedules, now)).toEqual(['due-1', 'due-2'])
  })

  it('excludes cards with nextReviewAt after end of today', () => {
    const tomorrow = endOfDay + 1
    const schedules: CardSchedule[] = [
      { cardId: 'future', nextReviewAt: tomorrow, interval: 1, easeFactor: 2.5, step: 1 },
    ]
    expect(getDueCardIds(schedules, now)).toEqual([])
  })

  it('orders by urgency: null first, then by nextReviewAt ascending', () => {
    const schedules: CardSchedule[] = [
      { cardId: 'c', nextReviewAt: endOfDay, interval: 1, easeFactor: 2.5, step: 1 },
      { cardId: 'a', nextReviewAt: null, interval: 0, easeFactor: 2.5, step: 0 },
      { cardId: 'b', nextReviewAt: now - 5000, interval: 1, easeFactor: 2.5, step: 1 },
    ]
    expect(getDueCardIds(schedules, now)).toEqual(['a', 'b', 'c'])
  })
})
