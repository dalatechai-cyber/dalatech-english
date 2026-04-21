const BLOCKED_PATTERNS = [
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
  /\bporn(ography|o)?\b/i,
  /\bsex(ual|ually|y)?\b/i,
  /\bnude(s)?\b/i,
  /\bnaked\b/i,
  /\bfuck\b/i,
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
]

export function isContentBlocked(text: string): boolean {
  return BLOCKED_PATTERNS.some(pattern => pattern.test(text))
}

export const BLOCKED_RESPONSE =
  'Уучлаарай, энэ сэдвээр ярилцах боломжгүй. Англи хэлний хичээлдээ буцаж орцгооё! 😊'
