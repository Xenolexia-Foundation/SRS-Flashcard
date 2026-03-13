import type { CardSchedule, ReviewOutcome } from './types'

export const DEFAULT_SRS_CONFIG = {
  initialIntervalDays: 1,
  secondIntervalDays: 6,
  maxIntervalDays: 365,
  minEaseFactor: 1.3,
  defaultEaseFactor: 2.5,
  againIntervalMinutes: 10,
  easeDelta: { again: -0.2, hard: -0.15, good: 0, easy: 0.15 },
} as const

const MS_PER_DAY = 24 * 60 * 60 * 1000
const MS_PER_MINUTE = 60 * 1000

export function endOfDayUTC(timestamp: number): number {
  const d = new Date(timestamp)
  d.setUTCHours(23, 59, 59, 999)
  return d.getTime()
}

export function scheduleAfterReview(
  outcome: ReviewOutcome,
  current: CardSchedule,
  now: number = Date.now()
): CardSchedule {
  const config = DEFAULT_SRS_CONFIG
  const cardId = current.cardId
  const nextReviewAt = (): number => {
    switch (outcome) {
      case 'again':
        return now + config.againIntervalMinutes * MS_PER_MINUTE
      case 'hard': {
        const days =
          current.step === 0
            ? config.initialIntervalDays
            : Math.max(0.5, (current.interval / MS_PER_DAY) * 0.8)
        return now + Math.round(days * MS_PER_DAY)
      }
      case 'good': {
        let days: number
        if (current.step === 0) days = config.initialIntervalDays
        else if (current.step === 1) days = config.secondIntervalDays
        else days = (current.interval / MS_PER_DAY) * current.easeFactor
        days = Math.min(days, config.maxIntervalDays)
        return now + Math.round(days * MS_PER_DAY)
      }
      case 'easy': {
        let days: number
        if (current.step === 0) days = config.secondIntervalDays
        else if (current.step === 1) days = config.initialIntervalDays * 4
        else days = (current.interval / MS_PER_DAY) * current.easeFactor * 1.3
        days = Math.min(days, config.maxIntervalDays)
        return now + Math.round(days * MS_PER_DAY)
      }
    }
  }
  const newEase =
    current.step === 0 && outcome === 'again'
      ? current.easeFactor
      : Math.max(config.minEaseFactor, current.easeFactor + config.easeDelta[outcome])
  const newStep = outcome === 'again' ? 0 : current.step + 1
  return {
    cardId,
    nextReviewAt: nextReviewAt(),
    interval: nextReviewAt() - now,
    easeFactor: newEase,
    step: newStep,
  }
}

export function initialSchedule(cardId: string): CardSchedule {
  return {
    cardId,
    nextReviewAt: null,
    interval: 0,
    easeFactor: DEFAULT_SRS_CONFIG.defaultEaseFactor,
    step: 0,
  }
}

export function getDueCardIds(
  schedules: CardSchedule[],
  now: number = Date.now()
): string[] {
  const cutoff = endOfDayUTC(now)
  const due = schedules.filter(
    (s) => s.nextReviewAt === null || s.nextReviewAt <= cutoff
  )
  due.sort((a, b) => {
    const ta = a.nextReviewAt ?? 0
    const tb = b.nextReviewAt ?? 0
    return ta - tb
  })
  return due.map((s) => s.cardId)
}
