import AsyncStorage from '@react-native-async-storage/async-storage'
import { STORAGE_KEYS } from './types'
import type { Card, CardSchedule, Deck, ReviewRecord, ReviewOutcome } from './types'
import { initialSchedule, scheduleAfterReview } from './srs'

async function getJSON<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key)
    if (raw == null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

async function setJSON(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value))
  } catch {}
}

export async function getDecks(): Promise<Deck[]> {
  return getJSON(STORAGE_KEYS.DECKS, [])
}

export async function getDeck(id: string): Promise<Deck | undefined> {
  const decks = await getDecks()
  return decks.find((d) => d.id === id)
}

export async function saveDeck(deck: Deck): Promise<void> {
  const decks = await getDecks()
  if (decks.some((d) => d.id === deck.id)) return
  await setJSON(STORAGE_KEYS.DECKS, [...decks, deck])
}

export async function updateDeck(deck: Deck): Promise<void> {
  const decks = await getDecks()
  await setJSON(
    STORAGE_KEYS.DECKS,
    decks.map((d) => (d.id === deck.id ? deck : d))
  )
}

export async function deleteDeck(id: string): Promise<void> {
  const decks = (await getDecks()).filter((d) => d.id !== id)
  await setJSON(STORAGE_KEYS.DECKS, decks)
  const cards = await getCards(id)
  for (const c of cards) await deleteCard(c.id)
}

export async function getCards(deckId: string): Promise<Card[]> {
  const all = await getJSON<Card[]>(STORAGE_KEYS.CARDS, [])
  return all.filter((c) => c.deckId === deckId)
}

export async function getCard(id: string): Promise<Card | undefined> {
  const all = await getJSON<Card[]>(STORAGE_KEYS.CARDS, [])
  return all.find((c) => c.id === id)
}

export async function saveCard(card: Card): Promise<void> {
  const cards = await getJSON<Card[]>(STORAGE_KEYS.CARDS, [])
  if (cards.some((c) => c.id === card.id)) return
  await setJSON(STORAGE_KEYS.CARDS, [...cards, card])
  const schedules = await getJSON<CardSchedule[]>(STORAGE_KEYS.SCHEDULES, [])
  await setJSON(STORAGE_KEYS.SCHEDULES, [...schedules, initialSchedule(card.id)])
}

export async function updateCard(card: Card): Promise<void> {
  const cards = await getJSON<Card[]>(STORAGE_KEYS.CARDS, [])
  await setJSON(
    STORAGE_KEYS.CARDS,
    cards.map((c) => (c.id === card.id ? card : c))
  )
}

export async function deleteCard(id: string): Promise<void> {
  const cards = (await getJSON<Card[]>(STORAGE_KEYS.CARDS, [])).filter(
    (c) => c.id !== id
  )
  await setJSON(STORAGE_KEYS.CARDS, cards)
  const schedules = (
    await getJSON<CardSchedule[]>(STORAGE_KEYS.SCHEDULES, [])
  ).filter((s) => s.cardId !== id)
  await setJSON(STORAGE_KEYS.SCHEDULES, schedules)
  const history = (
    await getJSON<ReviewRecord[]>(STORAGE_KEYS.REVIEW_HISTORY, [])
  ).filter((r) => r.cardId !== id)
  await setJSON(STORAGE_KEYS.REVIEW_HISTORY, history)
}

export async function getSchedules(deckId?: string): Promise<CardSchedule[]> {
  const all = await getJSON<CardSchedule[]>(STORAGE_KEYS.SCHEDULES, [])
  if (deckId == null) return all
  const cards = await getCards(deckId)
  const cardIds = new Set(cards.map((c) => c.id))
  return all.filter((s) => cardIds.has(s.cardId))
}

async function getSchedule(cardId: string): Promise<CardSchedule | undefined> {
  const all = await getJSON<CardSchedule[]>(STORAGE_KEYS.SCHEDULES, [])
  return all.find((s) => s.cardId === cardId)
}

async function saveSchedule(schedule: CardSchedule): Promise<void> {
  const schedules = await getJSON<CardSchedule[]>(STORAGE_KEYS.SCHEDULES, [])
  const idx = schedules.findIndex((s) => s.cardId === schedule.cardId)
  const next =
    idx >= 0
      ? schedules.map((s, i) => (i === idx ? schedule : s))
      : [...schedules, schedule]
  await setJSON(STORAGE_KEYS.SCHEDULES, next)
}

export async function recordReview(
  cardId: string,
  outcome: ReviewOutcome,
  now: number = Date.now()
): Promise<void> {
  const record: ReviewRecord = { cardId, timestamp: now, outcome }
  const history = await getJSON<ReviewRecord[]>(STORAGE_KEYS.REVIEW_HISTORY, [])
  await setJSON(STORAGE_KEYS.REVIEW_HISTORY, [...history, record])
  const current = (await getSchedule(cardId)) ?? initialSchedule(cardId)
  const next = scheduleAfterReview(outcome, current, now)
  await saveSchedule(next)
}

export async function getDueCards(deckId: string): Promise<Card[]> {
  const { getDueCardIds } = await import('./srs')
  const schedules = await getSchedules(deckId)
  const dueIds = getDueCardIds(schedules)
  const deckCards = await getCards(deckId)
  const scheduledCardIds = new Set(schedules.map((s) => s.cardId))
  const newCardIds = deckCards
    .filter((c) => !scheduledCardIds.has(c.id))
    .map((c) => c.id)
  const orderedIds = [...dueIds]
  for (const id of newCardIds) {
    if (!orderedIds.includes(id)) orderedIds.push(id)
  }
  const cards: Card[] = []
  for (const id of orderedIds) {
    const card = await getCard(id)
    if (card) cards.push(card)
  }
  return cards
}
