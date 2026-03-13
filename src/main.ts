/**
 * App entry: view state and render loop.
 */
import './style.css'
import type { Card } from './types'
import { getSchedules, getCards, getCard } from './storage'
import { getDueCardIds } from './srs'
import { renderDeckList } from './views/deck-list'
import { renderDeckDetail } from './views/deck-detail'
import { renderReview } from './views/review'

type ViewState =
  | { view: 'deck-list' }
  | { view: 'deck-detail'; deckId: string }
  | { view: 'review'; deckId: string; queue: Card[]; index: number }

let state: ViewState = { view: 'deck-list' }

function getDueCards(deckId: string): Card[] {
  const schedules = getSchedules(deckId)
  const dueIds = getDueCardIds(schedules)
  const deckCards = getCards(deckId)
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
    const card = getCard(id)
    if (card) cards.push(card)
  }
  return cards
}

function render(): void {
  const app = document.querySelector<HTMLDivElement>('#app')
  if (!app) return

  if (state.view === 'deck-list') {
    app.replaceChildren(
      renderDeckList({
        onOpenDeck(deckId) {
          state = { view: 'deck-detail', deckId }
          render()
        },
        onRefresh: () => render(),
      })
    )
    return
  }

  if (state.view === 'deck-detail') {
    const deckId = state.deckId
    app.replaceChildren(
      renderDeckDetail(deckId, {
        onBack() {
          state = { view: 'deck-list' }
          render()
        },
        onStartStudy() {
          const queue = getDueCards(deckId)
          if (queue.length === 0) {
            alert('No cards due right now.')
            return
          }
          state = { view: 'review', deckId, queue, index: 0 }
          render()
        },
      })
    )
    return
  }

  if (state.view === 'review') {
    const reviewState = state
    app.replaceChildren(
      renderReview(reviewState.deckId, reviewState.queue, reviewState.index, {
        onOutcome() {
          state = { ...reviewState, index: reviewState.index + 1 }
          render()
        },
        onBack() {
          state = { view: 'deck-detail', deckId: reviewState.deckId }
          render()
        },
      })
    )
  }
}

render()
