import type { Card } from '../types'
import { getDeck } from '../storage'
import { recordReview } from '../storage'
import type { ReviewOutcome } from '../types'
import { speak, isTtsAvailable } from '../tts'

function escapeHtml(s: string): string {
  const div = document.createElement('div')
  div.textContent = s
  return div.innerHTML
}

export type ReviewCallbacks = {
  onOutcome: (cardId: string, outcome: ReviewOutcome) => void
  onBack: () => void
}

export function renderReview(
  deckId: string,
  queue: Card[],
  index: number,
  callbacks: ReviewCallbacks
): HTMLElement {
  const deck = getDeck(deckId)
  const root = document.createElement('div')
  root.className = 'view review'

  const header = document.createElement('header')
  header.className = 'review-header'
  header.innerHTML = `
    <button type="button" class="btn-back" aria-label="Exit review">← Exit</button>
    <h1 class="review-title">${deck ? escapeHtml(deck.name) : 'Review'}</h1>
  `
  header.querySelector('.btn-back')?.addEventListener('click', () => {
    callbacks.onBack()
  })
  root.appendChild(header)

  if (index >= queue.length) {
    const done = document.createElement('div')
    done.className = 'review-done'
    const total = queue.length
    done.innerHTML = `
      <p class="review-done-title">Done</p>
      <p class="review-done-stats">Reviewed ${total} card${total === 1 ? '' : 's'}</p>
      <button type="button" class="btn-done-back">Back to deck</button>
    `
    done.querySelector('.btn-done-back')?.addEventListener('click', () => {
      callbacks.onBack()
    })
    root.appendChild(done)
    return root
  }

  const card = queue[index]
  if (!card) {
    root.appendChild(document.createTextNode('No card.'))
    return root
  }

  const progress = document.createElement('p')
  progress.className = 'review-progress'
  progress.textContent = `${index + 1} of ${queue.length}`
  root.appendChild(progress)

  const cardArea = document.createElement('div')
  cardArea.className = 'review-card'

  const frontEl = document.createElement('div')
  frontEl.className = 'review-card-front'
  frontEl.textContent = card.front

  const backEl = document.createElement('div')
  backEl.className = 'review-card-back'
  backEl.textContent = card.back

  const showBtn = document.createElement('button')
  showBtn.type = 'button'
  showBtn.className = 'btn-show-answer'
  showBtn.textContent = 'Show answer'

  let speakFrontBtn: HTMLButtonElement | null = null
  if (isTtsAvailable()) {
    speakFrontBtn = document.createElement('button')
    speakFrontBtn.type = 'button'
    speakFrontBtn.className = 'btn-speak'
    speakFrontBtn.textContent = 'Speak'
    speakFrontBtn.addEventListener('click', () => speak(card.front))
  }

  const ratingEl = document.createElement('div')
  ratingEl.className = 'review-rating'
  ratingEl.innerHTML = `
    <button type="button" class="btn-rating btn-again">Again</button>
    <button type="button" class="btn-rating btn-hard">Hard</button>
    <button type="button" class="btn-rating btn-good">Good</button>
    <button type="button" class="btn-rating btn-easy">Easy</button>
  `

  let speakBackBtn: HTMLButtonElement | null = null
  if (isTtsAvailable()) {
    speakBackBtn = document.createElement('button')
    speakBackBtn.type = 'button'
    speakBackBtn.className = 'btn-speak'
    speakBackBtn.textContent = 'Speak'
    speakBackBtn.addEventListener('click', () => speak(card.back))
  }

  const outcomes: ReviewOutcome[] = ['again', 'hard', 'good', 'easy']
  for (const outcome of outcomes) {
    const btn = ratingEl.querySelector(`.btn-${outcome}`)
    btn?.addEventListener('click', () => {
      recordReview(card.id, outcome)
      callbacks.onOutcome(card.id, outcome)
    })
  }

  showBtn.addEventListener('click', () => {
    cardArea.removeChild(frontEl)
    cardArea.removeChild(showBtn)
    if (speakFrontBtn && cardArea.contains(speakFrontBtn)) cardArea.removeChild(speakFrontBtn)
    cardArea.appendChild(backEl)
    if (speakBackBtn) cardArea.appendChild(speakBackBtn)
    cardArea.appendChild(ratingEl)
  })

  cardArea.appendChild(frontEl)
  cardArea.appendChild(showBtn)
  if (speakFrontBtn) cardArea.appendChild(speakFrontBtn)
  root.appendChild(cardArea)
  return root
}
