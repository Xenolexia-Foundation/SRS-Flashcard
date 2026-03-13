/**
 * Import / export: JSON backup and optional CSV for cards.
 */
import type { Card, CardSchedule, Deck, ReviewRecord } from './types'
import {
  getDecks,
  getCards,
  getSchedules,
  getReviewHistory,
  mergeDecks,
  mergeCards,
  mergeSchedules,
  mergeReviewHistory,
  saveDeck,
  saveCard,
} from './storage'

const EXPORT_VERSION = 1

export interface ExportData {
  version: number
  exportedAt: number
  decks: Deck[]
  cards: Card[]
  schedules: CardSchedule[]
  reviewHistory: ReviewRecord[]
}

export type ImportResult =
  | { ok: true; decksAdded: number; cardsAdded: number }
  | { ok: false; error: string }

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/** Export all data as JSON and trigger download */
export function exportToJson(): void {
  const decks = getDecks()
  const cards = decks.flatMap((d) => getCards(d.id))
  const schedules = getSchedules()
  const history = getReviewHistory()
  const data: ExportData = {
    version: EXPORT_VERSION,
    exportedAt: Date.now(),
    decks,
    cards,
    schedules,
    reviewHistory: history,
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  })
  downloadBlob(blob, `srs-backup-${new Date().toISOString().slice(0, 10)}.json`)
}

/** Export a single deck's cards as CSV (deck,front,back) */
export function exportDeckToCsv(deckId: string, deckName: string): void {
  const cards = getCards(deckId)
  const header = 'deck,front,back\n'
  const escape = (s: string) => {
    const t = s.replace(/"/g, '""')
    return t.includes(',') || t.includes('"') || t.includes('\n') ? `"${t}"` : t
  }
  const rows = cards.map((c) => `${escape(deckName)},${escape(c.front)},${escape(c.back)}`).join('\n')
  const csv = header + rows
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  downloadBlob(blob, `srs-${deckName.replace(/[^a-z0-9]/gi, '-')}.csv`)
}

function isExportData(x: unknown): x is ExportData {
  if (x == null || typeof x !== 'object') return false
  const o = x as Record<string, unknown>
  return (
    typeof o.version === 'number' &&
    Array.isArray(o.decks) &&
    Array.isArray(o.cards) &&
    Array.isArray(o.schedules) &&
    Array.isArray(o.reviewHistory)
  )
}

/** Import from JSON string (merge by id). */
export function importFromJson(json: string): ImportResult {
  let data: unknown
  try {
    data = JSON.parse(json)
  } catch {
    return { ok: false, error: 'Invalid JSON' }
  }
  if (!isExportData(data)) {
    return { ok: false, error: 'Invalid format: expected version, decks, cards, schedules, reviewHistory' }
  }
  if (data.version !== EXPORT_VERSION) {
    return { ok: false, error: `Unsupported export version: ${data.version}` }
  }
  const decksBefore = getDecks().length
  const cardsBefore = getDecks().reduce((n, d) => n + getCards(d.id).length, 0)
  mergeDecks(data.decks)
  mergeCards(data.cards)
  mergeSchedules(data.schedules)
  mergeReviewHistory(data.reviewHistory)
  const decksAfter = getDecks().length
  const cardsAfter = getDecks().reduce((n, d) => n + getCards(d.id).length, 0)
  return {
    ok: true,
    decksAdded: Math.max(0, decksAfter - decksBefore),
    cardsAdded: Math.max(0, cardsAfter - cardsBefore),
  }
}

/** Parse CSV line respecting quoted fields */
function parseCsvLine(line: string): string[] {
  const out: string[] = []
  let i = 0
  while (i < line.length) {
    if (line[i] === '"') {
      let s = ''
      i++
      while (i < line.length) {
        if (line[i] === '"') {
          i++
          if (line[i] === '"') {
            s += '"'
            i++
          } else break
        } else {
          s += line[i]
          i++
        }
      }
      out.push(s)
    } else {
      const j = line.indexOf(',', i)
      if (j < 0) {
        out.push(line.slice(i).trim())
        break
      }
      out.push(line.slice(i, j).trim())
      i = j + 1
    }
  }
  return out
}

/** Import from CSV (deck,front,back). Creates "Imported" deck if targetDeckId not given. */
export function importFromCsv(
  csv: string,
  targetDeckId: string | null,
  targetDeckName: string
): ImportResult {
  const lines = csv.trim().split(/\r?\n/).filter((l) => l.trim())
  if (lines.length < 2) {
    return { ok: false, error: 'CSV must have header and at least one row' }
  }
  const header = parseCsvLine(lines[0]!)
  const frontCol = header.findIndex((h) => /front/i.test(h))
  const backCol = header.findIndex((h) => /back/i.test(h))
  if (frontCol < 0 || backCol < 0) {
    return { ok: false, error: 'CSV must have "front" and "back" columns' }
  }
  let deckId = targetDeckId
  if (!deckId) {
    const deck: Deck = {
      id: crypto.randomUUID(),
      name: targetDeckName,
      createdAt: Date.now(),
    }
    saveDeck(deck)
    deckId = deck.id
  }
  let added = 0
  for (let i = 1; i < lines.length; i++) {
    const row = parseCsvLine(lines[i]!)
    const front = row[frontCol] ?? ''
    const back = row[backCol] ?? ''
    if (!front.trim() && !back.trim()) continue
    const card: Card = {
      id: crypto.randomUUID(),
      deckId,
      front: front.trim(),
      back: back.trim(),
      createdAt: Date.now(),
    }
    saveCard(card)
    added++
  }
  return { ok: true, decksAdded: targetDeckId ? 0 : 1, cardsAdded: added }
}