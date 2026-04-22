const BLOCKED_PATTERNS = [
  // Profanity (strong)
  /\bf+u+c+k(ing|er|ed|s)?\b/i,
  /\bs+h+i+t(ty|s|ted)?\b/i,
  /\bb+i+t+c+h(es|ing)?\b/i,
  /\ba+s+s+h+o+l+e\b/i,
  /\bc+u+n+t\b/i,
  /\bd+i+c+k\b/i,
  /\bw+h+o+r+e\b/i,
  /\bs+l+u+t\b/i,
  /\bn+i+g+g+e+r\b/i,
  /\bf+a+g+g+o+t\b/i,
  /\bb+a+s+t+a+r+d\b/i,
  /\bp+r+i+c+k\b/i,
  /\bw+a+n+k(er)?\b/i,
  /\btwat\b/i,
  /\bmotherfucker\b/i,
  /\bbullshit\b/i,
  // Mild swears
  /\bdamn(it)?\b/i,
  /\bgoddamn\b/i,
  /\bcrap\b/i,
  /\bbloody hell\b/i,
  /\bwtf\b/i,
  /\bstfu\b/i,
  /\bshut up\b/i,
  /\bpiss(ed| off)?\b/i,
  // Insults directed at the AI / user
  /\byou(\s|'re\s|re\s|\s+are\s+)(stupid|dumb|idiot|moron|useless|trash|garbage|worthless|pathetic|retarded|dumbass)\b/i,
  /\b(stupid|dumb|idiot|moron|useless|retarded|dumbass)\s+(ai|bot|robot|chat(bot)?|thing|program|assistant|you)\b/i,
  /\b(hate|screw|fuck)\s+(you|u|this|it)\b/i,
  /\byou\s+(suck|blow)\b/i,
  /\b(stfu|shut up)\b/i,
  /\b(kys|kill yourself)\b/i,
  // Standalone insults (commonly used as slurs)
  /\b(idiot|moron|retard|retarded|dumbass)\b/i,
  // Sexual / explicit
  /\bporn(ography|o)?\b/i,
  /\bsex(ual|ually|y)?\b/i,
  /\bnude(s)?\b/i,
  /\bnaked\b/i,
  // Violence / self-harm
  /\bi('ll| will) kill (you|him|her|them)\b/i,
  /\bkill yourself\b/i,
  /\bcommit suicide\b/i,
  // Mongolian Cyrillic offensive terms
  /хүй/i,
  /хуй/i,
  /нүцгэн/i,
  /зодох/i,
  /алах/i,
  /хүчирхийлэл/i,
  /тэнэг/i,
  /новш/i,
  /муухай/i,
]

export function isContentBlocked(text: string): boolean {
  return BLOCKED_PATTERNS.some(pattern => pattern.test(text))
}

export const BLOCKED_RESPONSE =
  'Уучлаарай, энэ сэдвээр ярилцах боломжгүй. Англи хэлний хичээлдээ буцаж орцгооё! 😊'
