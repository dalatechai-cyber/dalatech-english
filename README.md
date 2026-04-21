# Dalatech English — AI English Tutor for Mongolian Speakers

A1 to C1 level English tutoring powered by Claude claude-sonnet-4-6, built for Mongolian native speakers.

## Deploy to Vercel (Free)

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → Import your repo
3. Add environment variable: `ANTHROPIC_API_KEY` = your Anthropic API key
4. Deploy — you get a free URL like `dalatech-english.vercel.app`

## Local Development

```bash
cp .env.local.example .env.local
# Edit .env.local and add your ANTHROPIC_API_KEY

npm install
npm run dev
# Open http://localhost:3000
```

## Features

- 5 levels: A1, A2, B1, B2, C1
- 10 lessons per level + vocabulary practice in every lesson
- Level 10 exam required to unlock next level (pass mark: 10/15)
- Grammar corrections shown in Mongolian with yellow highlight
- All progress stored in localStorage — no sign-up required
- Streaming AI responses via Claude claude-sonnet-4-6

## App Structure

- Landing page: level selector with lock/unlock status and progress bars
- Level page: 10 lessons grid with sequential unlock
- Lesson page: WhatsApp-style chat with AI tutor
- Exam (lesson 10): scored 0–15, pass unlocks next level

## Stack

- Next.js 14 (App Router)
- TypeScript + Tailwind CSS
- Anthropic SDK (streaming)
- localStorage for progress (no database)

## Environment Variables

| Variable | Description |
|---|---|
| `ANTHROPIC_API_KEY` | Your Anthropic API key from console.anthropic.com |
