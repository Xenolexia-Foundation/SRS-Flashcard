/**
 * Core data shapes for the SRS flashcard app.
 * Single source of truth for storage and SRS algorithm.
 */

export interface Deck {
  id: string
  name: string
  createdAt: number
}

export interface Card {
  id: string
  deckId: string
  front: string
  back: string
  createdAt: number
}

export type ReviewOutcome = 'again' | 'hard' | 'good' | 'easy'

export interface ReviewRecord {
  cardId: string
  timestamp: number
  outcome: ReviewOutcome
}

/**
 * Per-card schedule state used by the SRS algorithm.
 * nextReviewAt: unix ms; null means "new" / due now.
 */
export interface CardSchedule {
  cardId: string
  nextReviewAt: number | null
  interval: number
  easeFactor: number
  step: number
}

/** Storage key prefix for app data */
export const STORAGE_KEYS = {
  DECKS: 'srs:decks',
  CARDS: 'srs:cards',
  SCHEDULES: 'srs:schedules',
  REVIEW_HISTORY: 'srs:reviewHistory',
} as const
