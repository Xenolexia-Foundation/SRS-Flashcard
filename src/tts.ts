/**
 * Optional TTS via Web Speech API.
 * No errors if unsupported (e.g. private mode, no synth).
 */

export interface SpeakOptions {
  lang?: string
  rate?: number
  pitch?: number
}

export function isTtsAvailable(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

/**
 * Speak text. No-op if TTS unavailable.
 * Cancels any current utterance before starting.
 */
export function speak(
  text: string,
  options: SpeakOptions = {}
): void {
  if (!isTtsAvailable() || !text.trim()) return
  const synth = window.speechSynthesis
  synth.cancel()
  const u = new SpeechSynthesisUtterance(text.trim())
  u.lang = options.lang ?? 'en-US'
  u.rate = options.rate ?? 1
  u.pitch = options.pitch ?? 1
  synth.speak(u)
}
