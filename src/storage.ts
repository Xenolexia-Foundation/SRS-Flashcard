/**
 * Copyright (C) 2016-2026 Husain Alamri (H4n) and Xenolexia Foundation.
 * Licensed under the GNU Affero General Public License v3.0 (AGPL-3.0). See LICENSE.
 */

/**
 * Local storage layer: single place for all persistence.
 * Uses STORAGE_KEYS; integrates with SRS for recordReview.
 */
import { STORAGE_KEYS } from './types'
import type { Card, CardSchedule, Deck, ReviewRecord, ReviewOutcome } from './types'
import { initialSchedule, scheduleAfterReview } from './srs'

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

let storageBackend: StorageLike | null =
  typeof localStorage !== 'undefined' ? localStorage : null

/** For tests: inject a mock storage. */
export function setStorageBackend(backend: StorageLike | null): void {
  storageBackend = backend
}

function getJSON<T>(key: string, fallback: T): T {
  if (!storageBackend) return fallback
  try {
    const raw = storageBackend.getItem(key)
    if (raw == null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function setJSON(key: string, value: unknown): void {
  if (!storageBackend) return
  try {
    storageBackend.setItem(key, JSON.stringify(value))
  } catch {
    // quota or private mode
  }
}

// --- Decks ---

export function getDecks(): Deck[] {
  return getJSON(STORAGE_KEYS.DECKS, [])
}

export function getDeck(id: string): Deck | undefined {
  return getDecks().find((d) => d.id === id)
}

export function saveDeck(deck: Deck): void {
  const decks = getDecks()
  if (decks.some((d) => d.id === deck.id)) return
  setJSON(STORAGE_KEYS.DECKS, [...decks, deck])
}

export function updateDeck(deck: Deck): void {
  const decks = getDecks().map((d) => (d.id === deck.id ? deck : d))
  setJSON(STORAGE_KEYS.DECKS, decks)
}

export function deleteDeck(id: string): void {
  const decks = getDecks().filter((d) => d.id !== id)
  setJSON(STORAGE_KEYS.DECKS, decks)
  const cards = getCards(id)
  for (const c of cards) deleteCard(c.id)
}

// --- Cards ---

export function getCards(deckId: string): Card[] {
  const all = getJSON<Card[]>(STORAGE_KEYS.CARDS, [])
  return all.filter((c) => c.deckId === deckId)
}

export function getCard(id: string): Card | undefined {
  return getJSON<Card[]>(STORAGE_KEYS.CARDS, []).find((c) => c.id === id)
}

export function saveCard(card: Card): void {
  const cards = getJSON<Card[]>(STORAGE_KEYS.CARDS, [])
  if (cards.some((c) => c.id === card.id)) return
  setJSON(STORAGE_KEYS.CARDS, [...cards, card])
  setJSON(STORAGE_KEYS.SCHEDULES, [
    ...getJSON<CardSchedule[]>(STORAGE_KEYS.SCHEDULES, []),
    initialSchedule(card.id),
  ])
}

export function updateCard(card: Card): void {
  const cards = getJSON<Card[]>(STORAGE_KEYS.CARDS, []).map((c) =>
    c.id === card.id ? card : c
  )
  setJSON(STORAGE_KEYS.CARDS, cards)
}

export function deleteCard(id: string): void {
  const cards = getJSON<Card[]>(STORAGE_KEYS.CARDS, []).filter((c) => c.id !== id)
  setJSON(STORAGE_KEYS.CARDS, cards)
  const schedules = getJSON<CardSchedule[]>(STORAGE_KEYS.SCHEDULES, []).filter(
    (s) => s.cardId !== id
  )
  setJSON(STORAGE_KEYS.SCHEDULES, schedules)
  const history = getJSON<ReviewRecord[]>(STORAGE_KEYS.REVIEW_HISTORY, []).filter(
    (r) => r.cardId !== id
  )
  setJSON(STORAGE_KEYS.REVIEW_HISTORY, history)
}

// --- Schedules ---

function getAllSchedules(): CardSchedule[] {
  return getJSON<CardSchedule[]>(STORAGE_KEYS.SCHEDULES, [])
}

function setAllSchedules(schedules: CardSchedule[]): void {
  setJSON(STORAGE_KEYS.SCHEDULES, schedules)
}

export function getSchedules(deckId?: string): CardSchedule[] {
  const all = getAllSchedules()
  if (deckId == null) return all
  const cardIds = new Set(getCards(deckId).map((c) => c.id))
  return all.filter((s) => cardIds.has(s.cardId))
}

function getSchedule(cardId: string): CardSchedule | undefined {
  return getAllSchedules().find((s) => s.cardId === cardId)
}

function saveSchedule(schedule: CardSchedule): void {
  const schedules = getAllSchedules()
  const idx = schedules.findIndex((s) => s.cardId === schedule.cardId)
  const next =
    idx >= 0
      ? schedules.map((s, i) => (i === idx ? schedule : s))
      : [...schedules, schedule]
  setAllSchedules(next)
}

// --- Review history ---

export function getReviewHistory(deckId?: string): ReviewRecord[] {
  const all = getJSON<ReviewRecord[]>(STORAGE_KEYS.REVIEW_HISTORY, [])
  if (deckId == null) return all
  const cardIds = new Set(getCards(deckId).map((c) => c.id))
  return all.filter((r) => cardIds.has(r.cardId))
}

/** Submit a review: append history, run SRS, persist updated schedule */
export function recordReview(
  cardId: string,
  outcome: ReviewOutcome,
  now: number = Date.now()
): void {
  const record: ReviewRecord = { cardId, timestamp: now, outcome }
  const history = getJSON<ReviewRecord[]>(STORAGE_KEYS.REVIEW_HISTORY, [])
  setJSON(STORAGE_KEYS.REVIEW_HISTORY, [...history, record])

  const current =
    getSchedule(cardId) ??
    initialSchedule(cardId)
  const next = scheduleAfterReview(outcome, current, now)
  saveSchedule(next)
}

/** Clear all app data (debug / reset) */
export function clearProgress(): void {
  if (!storageBackend) return
  for (const key of Object.values(STORAGE_KEYS)) {
    storageBackend.removeItem(key)
  }
}

// --- Import (merge) ---

/** Merge imported decks by id (existing kept, imported overwrite). */
export function mergeDecks(decks: Deck[]): void {
  const current = getJSON<Deck[]>(STORAGE_KEYS.DECKS, [])
  const byId = new Map(current.map((d) => [d.id, d]))
  for (const d of decks) byId.set(d.id, d)
  setJSON(STORAGE_KEYS.DECKS, [...byId.values()])
}

/** Merge imported cards by id. Does not add initial schedules; use mergeSchedules after. */
export function mergeCards(cards: Card[]): void {
  const current = getJSON<Card[]>(STORAGE_KEYS.CARDS, [])
  const byId = new Map(current.map((c) => [c.id, c]))
  for (const c of cards) byId.set(c.id, c)
  setJSON(STORAGE_KEYS.CARDS, [...byId.values()])
}

/** Merge imported schedules by cardId. */
export function mergeSchedules(schedules: CardSchedule[]): void {
  const current = getAllSchedules()
  const byCardId = new Map(current.map((s) => [s.cardId, s]))
  for (const s of schedules) byCardId.set(s.cardId, s)
  setAllSchedules([...byCardId.values()])
}

/** Merge imported review history by cardId+timestamp. */
export function mergeReviewHistory(records: ReviewRecord[]): void {
  const current = getJSON<ReviewRecord[]>(STORAGE_KEYS.REVIEW_HISTORY, [])
  const byKey = new Map(
    current.map((r) => [`${r.cardId}:${r.timestamp}`, r])
  )
  for (const r of records) byKey.set(`${r.cardId}:${r.timestamp}`, r)
  setJSON(STORAGE_KEYS.REVIEW_HISTORY, [...byKey.values()])
}
