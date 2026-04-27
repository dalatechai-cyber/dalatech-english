import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'midnight-ink': '#0B1222',
        'midnight-ink-deep': '#070C18',
        'midnight-ink-surface': '#141C30',
        'midnight-ink-elevated': '#1F2940',
        'candlelight-gold': '#F59E0B',
        'candlelight-gold-light': '#FCD34D',
        'candlelight-gold-dark': '#D97706',
        'vellum-champagne': '#E4C08A',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        // Certificate sub-system tokens — see DESIGN.md §7.
        // Apply ONLY to downloadable ceremonial artifacts (CertificateModal).
        // Do NOT use in working product UI.
        'certificate-navy': '#0F1E3D',
        'certificate-navy-deep': '#081230',
        'certificate-gold': '#C9A55C',
        'certificate-gold-deep': '#8B6F2E',
        'certificate-gold-light': '#E8D29A',
        'certificate-gold-pale': '#F5E7C2',
        'certificate-ivory': '#FDFCF5',
      },
      fontFamily: {
        serif: ['var(--font-playfair)', 'EB Garamond', 'Georgia', 'serif'],
        display: ['var(--font-playfair)', 'Georgia', 'serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-gold': 'pulseGold 2s infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { transform: 'translateY(10px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        pulseGold: { '0%, 100%': { boxShadow: '0 0 0 0 rgba(245,158,11,0.4)' }, '50%': { boxShadow: '0 0 0 8px rgba(245,158,11,0)' } },
      },
    },
  },
  plugins: [],
}
export default config
