/**
 * Copyright (C) 2016-2026 Husain Alamri (H4n) and Xenolexia Foundation.
 * Licensed under the GNU Affero General Public License v3.0 (AGPL-3.0). See LICENSE.
 */

import type { Card } from '../types'
import {
  getDeck,
  getCards,
  saveCard,
  updateCard,
  deleteCard,
} from '../storage'
import { exportDeckToCsv, importFromCsv } from '../import-export'

export type DeckDetailCallbacks = {
  onBack: () => void
  onStartStudy?: () => void
}

function escapeHtml(s: string): string {
  const div = document.createElement('div')
  div.textContent = s
  return div.innerHTML
}

function snippet(s: string, maxLen: number = 60): string {
  const t = s.trim()
  if (t.length <= maxLen) return t
  return t.slice(0, maxLen) + '…'
}

export function renderDeckDetail(
  deckId: string,
  callbacks: DeckDetailCallbacks
): HTMLElement {
  const deck = getDeck(deckId)
  const root = document.createElement('div')
  root.className = 'view deck-detail'

  if (!deck) {
    root.textContent = 'Deck not found.'
    return root
  }

  const header = document.createElement('header')
  header.className = 'deck-detail-header'
  header.innerHTML = `
    <button type="button" class="btn-back" aria-label="Back to decks">← Back</button>
    <h1 class="deck-title">${escapeHtml(deck.name)}</h1>
    ${callbacks.onStartStudy ? '<button type="button" class="btn-study">Study</button>' : ''}
  `
  header.querySelector('.btn-back')?.addEventListener('click', () => {
    callbacks.onBack()
  })
  header.querySelector('.btn-study')?.addEventListener('click', () => {
    callbacks.onStartStudy?.()
  })
  root.appendChild(header)

  const ioBar = document.createElement('div')
  ioBar.className = 'deck-detail-io'
  ioBar.innerHTML = `
    <button type="button" class="btn-export-csv">Export as CSV</button>
    <label class="btn-import-csv-label">
      <input type="file" accept=".csv,text/csv" class="input-import-csv" hidden />
      Import CSV into this deck
    </label>
  `
  ioBar.querySelector('.btn-export-csv')?.addEventListener('click', () => {
    exportDeckToCsv(deckId, deck.name)
  })
  const csvInput = ioBar.querySelector<HTMLInputElement>('.input-import-csv')
  csvInput?.addEventListener('change', () => {
    const file = csvInput.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const result = importFromCsv(reader.result as string, deckId, deck.name)
      if (result.ok) {
        alert(`Imported ${result.cardsAdded} cards.`)
        refreshCardList()
      } else {
        alert(`Import failed: ${result.error}`)
      }
      csvInput.value = ''
    }
    reader.readAsText(file)
  })
  root.appendChild(ioBar)

  const cardList = document.createElement('div')
  cardList.className = 'card-list'
  root.appendChild(cardList)

  function refreshCardList(): void {
    cardList.innerHTML = ''
    const cards = getCards(deckId)
    if (cards.length === 0) {
      const empty = document.createElement('p')
      empty.className = 'empty'
      empty.textContent = 'No cards yet. Add one below.'
      cardList.appendChild(empty)
    } else {
      const ul = document.createElement('ul')
      ul.className = 'card-list-items'
      for (const card of cards) {
        ul.appendChild(renderCardRow(card, () => refreshCardList()))
      }
      cardList.appendChild(ul)
    }
  }

  const addSection = document.createElement('form')
  addSection.className = 'add-card-form'
  addSection.innerHTML = `
    <h2>Add card</h2>
    <label>Front <input type="text" name="front" required maxlength="2000" /></label>
    <label>Back <input type="text" name="back" required maxlength="2000" /></label>
    <button type="submit">Add</button>
  `
  addSection.addEventListener('submit', (e) => {
    e.preventDefault()
    const frontEl = addSection.querySelector<HTMLInputElement>('input[name="front"]')
    const backEl = addSection.querySelector<HTMLInputElement>('input[name="back"]')
    const front = frontEl?.value?.trim()
    const back = backEl?.value?.trim()
    if (front === undefined || back === undefined || !frontEl || !backEl) return
    const card: Card = {
      id: crypto.randomUUID(),
      deckId,
      front,
      back,
      createdAt: Date.now(),
    }
    saveCard(card)
    frontEl.value = ''
    backEl.value = ''
    refreshCardList()
  })
  root.appendChild(addSection)

  refreshCardList()
  return root
}

function renderCardRow(card: Card, onUpdate: () => void): HTMLElement {
  const li = document.createElement('li')
  li.className = 'card-row'
  li.dataset.cardId = card.id

  const frontSnippet = escapeHtml(snippet(card.front))
  const backSnippet = escapeHtml(snippet(card.back))

  li.innerHTML = `
    <div class="card-preview">
      <span class="card-front">${frontSnippet}</span>
      <span class="card-back">${backSnippet}</span>
    </div>
    <div class="card-actions">
      <button type="button" class="btn-edit">Edit</button>
      <button type="button" class="btn-delete">Delete</button>
    </div>
  `

  li.querySelector('.btn-edit')?.addEventListener('click', () => {
    const newFront = prompt('Front', card.front)
    if (newFront === null) return
    const newBack = prompt('Back', card.back)
    if (newBack === null) return
    updateCard({ ...card, front: newFront.trim(), back: newBack.trim() })
    onUpdate()
  })

  li.querySelector('.btn-delete')?.addEventListener('click', () => {
    if (confirm('Delete this card?')) {
      deleteCard(card.id)
      onUpdate()
    }
  })

  return li
}
