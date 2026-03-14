/**
 * Copyright (C) 2016-2026 Husain Alamri (H4n) and Xenolexia Foundation.
 * Licensed under the GNU Affero General Public License v3.0 (AGPL-3.0). See LICENSE.
 */

import type { Deck } from '../types'
import { getDecks, saveDeck } from '../storage'
import { exportToJson, importFromJson, importFromCsv } from '../import-export'

export type DeckListCallbacks = {
  onOpenDeck: (deckId: string) => void
  onRefresh?: () => void
}

export function renderDeckList(callbacks: DeckListCallbacks): HTMLElement {
  const decks = getDecks()
  const root = document.createElement('div')
  root.className = 'view deck-list'

  const title = document.createElement('h1')
  title.textContent = 'Decks'
  root.appendChild(title)

  const toolbar = document.createElement('div')
  toolbar.className = 'deck-list-toolbar'
  toolbar.innerHTML = `
    <button type="button" class="btn-export-json">Export all (JSON)</button>
    <label class="btn-import-label">
      <input type="file" accept=".json,.csv,application/json,text/csv" class="input-import" hidden />
      Import
    </label>
  `
  const exportBtn = toolbar.querySelector('.btn-export-json')
  exportBtn?.addEventListener('click', () => exportToJson())
  const inputEl = toolbar.querySelector<HTMLInputElement>('.input-import')
  inputEl?.addEventListener('change', () => {
    const file = inputEl.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const text = reader.result as string
      const trimmed = text.trim()
      if (trimmed.startsWith('{')) {
        const result = importFromJson(text)
        if (result.ok) {
          alert(`Imported ${result.cardsAdded} cards, ${result.decksAdded} deck(s).`)
        } else {
          alert(`Import failed: ${result.error}`)
        }
      } else {
        const result = importFromCsv(text, null, 'Imported')
        if (result.ok) {
          alert(`Imported ${result.cardsAdded} cards${result.decksAdded ? ', 1 new deck' : ''}.`)
        } else {
          alert(`Import failed: ${result.error}`)
        }
      }
      inputEl.value = ''
      callbacks.onRefresh?.()
    }
    reader.readAsText(file)
  })
  root.appendChild(toolbar)

  const newDeckForm = document.createElement('form')
  newDeckForm.className = 'new-deck-form'
  newDeckForm.innerHTML = `
    <input type="text" name="name" placeholder="Deck name" required maxlength="200" />
    <button type="submit">New deck</button>
  `
  newDeckForm.addEventListener('submit', (e) => {
    e.preventDefault()
    const input = newDeckForm.querySelector<HTMLInputElement>('input[name="name"]')
    const name = input?.value?.trim()
    if (!name || !input) return
    const deck: Deck = {
      id: crypto.randomUUID(),
      name,
      createdAt: Date.now(),
    }
    saveDeck(deck)
    input.value = ''
    callbacks.onOpenDeck(deck.id)
  })
  root.appendChild(newDeckForm)

  const list = document.createElement('ul')
  list.className = 'deck-list-items'
  if (decks.length === 0) {
    const empty = document.createElement('li')
    empty.className = 'empty'
    empty.textContent = 'No decks yet. Create one above.'
    list.appendChild(empty)
  } else {
    for (const deck of decks) {
      const li = document.createElement('li')
      li.innerHTML = `
        <span class="deck-name">${escapeHtml(deck.name)}</span>
        <button type="button" class="btn-open">Open</button>
      `
      li.querySelector('.btn-open')?.addEventListener('click', () => {
        callbacks.onOpenDeck(deck.id)
      })
      list.appendChild(li)
    }
  }
  root.appendChild(list)

  return root
}

function escapeHtml(s: string): string {
  const div = document.createElement('div')
  div.textContent = s
  return div.innerHTML
}
