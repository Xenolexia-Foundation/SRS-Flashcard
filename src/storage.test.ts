import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  setStorageBackend,
  getDecks,
  getDeck,
  saveDeck,
  getCards,
  saveCard,
  getSchedules,
  getReviewHistory,
  recordReview,
  clearProgress,
} from './storage'
import type { Card, Deck } from './types'

function createMockStorage(): StorageLike {
  const store: Record<string, string> = {}
  return {
    getItem(key: string) {
      return store[key] ?? null
    },
    setItem(key: string, value: string) {
      store[key] = value
    },
    removeItem(key: string) {
      delete store[key]
    },
  }
}

type StorageLike = { getItem: (k: string) => string | null; setItem: (k: string, v: string) => void; removeItem: (k: string) => void }

describe('storage', () => {
  beforeEach(() => {
    setStorageBackend(createMockStorage())
    clearProgress()
  })

  afterEach(() => {
    setStorageBackend(
      typeof localStorage !== 'undefined' ? localStorage : null
    )
  })

  it('creates and reads a deck', () => {
    const deck: Deck = {
      id: 'deck-1',
      name: 'Test Deck',
      createdAt: 1000,
    }
    saveDeck(deck)
    expect(getDecks()).toEqual([deck])
    expect(getDeck('deck-1')).toEqual(deck)
    expect(getDeck('other')).toBeUndefined()
  })

  it('adds cards and assigns initial schedule', () => {
    const deck: Deck = { id: 'd1', name: 'D', createdAt: 1000 }
    saveDeck(deck)
    const card: Card = {
      id: 'c1',
      deckId: 'd1',
      front: 'Q',
      back: 'A',
      createdAt: 2000,
    }
    saveCard(card)
    expect(getCards('d1')).toEqual([card])
    const schedules = getSchedules('d1')
    expect(schedules).toHaveLength(1)
    expect(schedules[0]?.cardId).toBe('c1')
    expect(schedules[0]?.nextReviewAt).toBeNull()
    expect(schedules[0]?.step).toBe(0)
  })

  it('recordReview appends history and updates schedule', () => {
    const deck: Deck = { id: 'd1', name: 'D', createdAt: 1000 }
    saveDeck(deck)
    const card: Card = {
      id: 'c1',
      deckId: 'd1',
      front: 'Q',
      back: 'A',
      createdAt: 2000,
    }
    saveCard(card)
    const now = 3000
    recordReview('c1', 'good', now)
    const history = getReviewHistory('d1')
    expect(history).toHaveLength(1)
    expect(history[0]).toEqual({ cardId: 'c1', timestamp: now, outcome: 'good' })
    const schedules = getSchedules('d1')
    expect(schedules).toHaveLength(1)
    expect(schedules[0]?.nextReviewAt).not.toBeNull()
    expect(schedules[0]?.step).toBe(1)
  })

  it('recordReview again then good updates schedule correctly', () => {
    const deck: Deck = { id: 'd1', name: 'D', createdAt: 1000 }
    saveDeck(deck)
    const card: Card = {
      id: 'c1',
      deckId: 'd1',
      front: 'Q',
      back: 'A',
      createdAt: 2000,
    }
    saveCard(card)
    const now = 10000
    recordReview('c1', 'again', now)
    let schedules = getSchedules('d1')
    expect(schedules[0]?.step).toBe(0)
    recordReview('c1', 'good', now + 600000)
    schedules = getSchedules('d1')
    expect(schedules[0]?.step).toBe(1)
    expect(getReviewHistory('d1')).toHaveLength(2)
  })
})
