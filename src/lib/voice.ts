// Utility for Speech Recognition (STT) and Speech Synthesis (TTS) in Nova AI Voice Assistant

export interface VoiceOptions {
  lang: 'bn-BD' | 'en-US'
  rate?: number
  pitch?: number
  onStart?: () => void
  onEnd?: () => void
  onError?: (err: any) => void
}

/**
 * Strips markdown symbols, code fences, links, and formatting so text-to-speech speaks smoothly.
 */
export function cleanTextForSpeech(markdown: string): string {
  if (!markdown) return ''

  return (
    markdown
      // Remove code blocks
      .replace(/```[\s\S]*?```/g, ' কোড ব্লক। ')
      // Remove inline code
      .replace(/`([^`]+)`/g, '$1')
      // Remove images and links [text](url) -> text
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      // Remove headings (# Heading)
      .replace(/^#{1,6}\s+/gm, '')
      // Remove bold/italic markers
      .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1')
      // Remove blockquotes (> quote)
      .replace(/^>\s+/gm, '')
      // Remove bullet list markers
      .replace(/^[-*+]\s+/gm, '')
      // Remove numbered list markers
      .replace(/^\d+\.\s+/gm, '')
      // Remove HTML tags
      .replace(/<[^>]*>/g, '')
      // Replace multiple newlines or spaces with single space
      .replace(/\s+/g, ' ')
      .trim()
  )
}

/**
 * Detects if a text is predominantly Bengali or English
 */
export function detectLanguage(text: string): 'bn-BD' | 'en-US' {
  // Bengali Unicode range: \u0980-\u09FF
  const bengaliRegex = /[\u0980-\u09FF]/g
  const matches = text.match(bengaliRegex)
  if (matches && matches.length > 5) {
    return 'bn-BD'
  }
  return 'en-US'
}

/**
 * Finds the most suitable voice for speech synthesis
 */
function getBestVoice(voices: SpeechSynthesisVoice[], lang: 'bn-BD' | 'en-US'): SpeechSynthesisVoice | null {
  if (!voices || voices.length === 0) return null

  if (lang === 'bn-BD') {
    // Look for exact matches or Bengali voices
    const exact = voices.find(
      (v) =>
        v.lang === 'bn-BD' ||
        v.lang === 'bn-IN' ||
        v.lang.toLowerCase().startsWith('bn') ||
        v.name.toLowerCase().includes('bangla') ||
        v.name.toLowerCase().includes('bengali')
    )
    if (exact) return exact
  }

  // Look for English voices
  if (lang === 'en-US') {
    const enUs = voices.find((v) => v.lang === 'en-US' || v.lang === 'en_US')
    if (enUs) return enUs
    const enAny = voices.find((v) => v.lang.startsWith('en'))
    if (enAny) return enAny
  }

  // Fallback to default or first voice
  return voices.find((v) => v.default) || voices[0] || null
}

/**
 * Synthesizes speech using the browser Web Speech API
 */
export function speakNovaText(text: string, options?: VoiceOptions): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return false
  }

  try {
    // Cancel any previous speech
    window.speechSynthesis.cancel()

    const cleanText = cleanTextForSpeech(text)
    if (!cleanText) return false

    const utterance = new SpeechSynthesisUtterance(cleanText)
    const targetLang = options?.lang || detectLanguage(cleanText)
    utterance.lang = targetLang
    utterance.rate = options?.rate ?? 1.0
    utterance.pitch = options?.pitch ?? 1.0

    const voices = window.speechSynthesis.getVoices()
    const bestVoice = getBestVoice(voices, targetLang)
    if (bestVoice) {
      utterance.voice = bestVoice
    }

    if (options?.onStart) utterance.onstart = options.onStart
    if (options?.onEnd) utterance.onend = options.onEnd
    if (options?.onError) utterance.onerror = options.onError

    window.speechSynthesis.speak(utterance)
    return true
  } catch (err) {
    console.error('Speech synthesis error:', err)
    return false
  }
}

/**
 * Stops any active speech synthesis
 */
export function stopNovaSpeech(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }
}

/**
 * Checks if Speech Recognition is supported in the current browser
 */
export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false
  return Boolean(
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  )
}
