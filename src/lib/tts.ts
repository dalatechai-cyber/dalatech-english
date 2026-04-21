export interface TTSVoiceOptions {
  pitch?: number
  rate?: number
  preferUri?: string
}

function findVoice(preferUri: string, lang: string): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices()
  // Try preferred URI first
  const preferred = voices.find(v => v.voiceURI.includes(preferUri))
  if (preferred) return preferred
  // Fall back to lang match
  return voices.find(v => v.lang.startsWith(lang)) ?? null
}

export function speakTurn(text: string, opts: TTSVoiceOptions = {}): Promise<void> {
  return new Promise(resolve => {
    if (typeof window === 'undefined' || !window.speechSynthesis) { resolve(); return }
    window.speechSynthesis.cancel()
    const utt = new SpeechSynthesisUtterance(text)
    utt.pitch = opts.pitch ?? 1.0
    utt.rate = opts.rate ?? 0.9
    if (opts.preferUri) {
      const v = findVoice(opts.preferUri, 'en')
      if (v) utt.voice = v
    }
    utt.onend = () => resolve()
    utt.onerror = () => resolve()
    window.speechSynthesis.speak(utt)
  })
}

export function stopSpeech(): void {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel()
  }
}

export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

export function isSpeechRecognitionSupported(): boolean {
  return typeof window !== 'undefined' && (
    'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getSpeechRecognition(): any | null {
  if (typeof window === 'undefined') return null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition ?? null
}
