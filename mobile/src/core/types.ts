/**
 * Copyright (C) 2016-2026 Husain Alamri (H4n) and Xenolexia Foundation.
 * Licensed under the GNU Affero General Public License v3.0 (AGPL-3.0). See LICENSE.
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

export interface CardSchedule {
  cardId: string
  nextReviewAt: number | null
  interval: number
  easeFactor: number
  step: number
}

export const STORAGE_KEYS = {
  DECKS: 'srs:decks',
  CARDS: 'srs:cards',
  SCHEDULES: 'srs:schedules',
  REVIEW_HISTORY: 'srs:reviewHistory',
} as const
