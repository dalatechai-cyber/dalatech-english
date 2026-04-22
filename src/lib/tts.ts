export interface TTSVoiceOptions {
  pitch?: number
  rate?: number
  preferUri?: string
  voice?: SpeechSynthesisVoice | null
}

function findVoice(preferUri: string, lang: string): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices()
  // Exact name match
  const byName = voices.find(v => v.name === preferUri)
  if (byName) return byName
  // Partial URI or name match
  const byUri = voices.find(v => v.voiceURI.includes(preferUri) || v.name.includes(preferUri))
  if (byUri) return byUri
  // Lang with Female in name
  const langFemale = voices.find(v => v.lang.startsWith(lang) && v.name.toLowerCase().includes('female'))
  if (langFemale) return langFemale
  return voices.find(v => v.lang.startsWith(lang)) ?? null
}

// Listening Speaker A — Female, British
export function selectListeningVoiceA(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null
  const voices = window.speechSynthesis.getVoices()
  return (
    voices.find(v => v.name === 'Google UK English Female') ??
    voices.find(v => v.name.includes('Hazel')) ??
    voices.find(v => v.name === 'Karen') ??
    voices.find(v => v.lang.startsWith('en-GB') && v.name.toLowerCase().includes('female')) ??
    voices.find(v => v.lang.startsWith('en-GB')) ??
    voices.find(v => v.lang.startsWith('en')) ??
    null
  )
}

// Listening Speaker B — Male, British or American
export function selectListeningVoiceB(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null
  const voices = window.speechSynthesis.getVoices()
  return (
    voices.find(v => v.name === 'Google UK English Male') ??
    voices.find(v => v.name.includes('George')) ??
    voices.find(v => v.name === 'Daniel') ??
    voices.find(v => v.lang.startsWith('en-GB') && !v.name.toLowerCase().includes('female')) ??
    voices.find(v => v.name === 'Google US English') ??
    voices.find(v => v.lang.startsWith('en-US') && !v.name.toLowerCase().includes('female')) ??
    voices.find(v => v.lang.startsWith('en')) ??
    null
  )
}

export function speakTurn(text: string, opts: TTSVoiceOptions = {}): Promise<void> {
  return new Promise(resolve => {
    if (typeof window === 'undefined' || !window.speechSynthesis) { resolve(); return }
    window.speechSynthesis.cancel()
    const utt = new SpeechSynthesisUtterance(text)
    utt.pitch = opts.pitch ?? 1.0
    utt.rate = opts.rate ?? 0.9
    if (opts.voice) {
      utt.voice = opts.voice
    } else if (opts.preferUri) {
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
