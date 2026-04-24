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

type OS = 'ios' | 'android' | 'windows' | 'mac' | 'other'

function detectOS(): OS {
  if (typeof navigator === 'undefined') return 'other'
  const ua = navigator.userAgent
  if (/iPhone|iPad|iPod/.test(ua)) return 'ios'
  if (/Android/.test(ua)) return 'android'
  if (/Windows/.test(ua)) return 'windows'
  if (/Macintosh|Mac OS X/.test(ua)) return 'mac'
  return 'other'
}

// Per-platform preference list for a natural male English voice. Order
// matters — first match wins. Exact or prefix matches avoid the robotic
// generic fallbacks like "English Male".
const MALE_VOICE_PREFERENCES: Record<OS, string[]> = {
  ios:     ['Daniel', 'Alex'],
  android: ['Google UK English Male'],
  windows: ['Microsoft George', 'Microsoft David'],
  mac:     ['Daniel', 'Tom'],
  other:   [],
}

// Listening Speaker B — Male, British or American. Tries the current OS's
// best native male voice first, then a cross-platform high-quality list,
// then generic fallbacks.
export function selectListeningVoiceB(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null
  const voices = window.speechSynthesis.getVoices()
  const os = detectOS()
  const preferred = [
    ...MALE_VOICE_PREFERENCES[os],
    'Daniel',
    'Google UK English Male',
    'Microsoft George',
    'Microsoft David',
    'Alex',
    'Tom',
  ]
  for (const name of preferred) {
    const hit =
      voices.find(v => v.name === name) ??
      voices.find(v => v.name.startsWith(name))
    if (hit) return hit
  }
  return (
    voices.find(v => v.lang.startsWith('en-GB') && !v.name.toLowerCase().includes('female')) ??
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
