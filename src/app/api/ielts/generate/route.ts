import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({})) as { seed?: number }
    const seed = body.seed ?? Date.now()

    const systemPrompt = `You are an IELTS Academic test generator. Seed: ${seed}.
Use a fresh, unique topic every time.

Generate a complete IELTS-style mock test. Return ONLY valid JSON matching this exact structure:

{
  "listening": {
    "conversation": [
      {"speaker": "A", "text": "..."},
      {"speaker": "B", "text": "..."}
    ],
    "questions": [
      {"question": "...", "options": ["A","B","C","D"], "correct": 0}
    ]
  },
  "reading": {
    "passage": "...",
    "questions": [
      {"question": "...", "options": ["A","B","C","D"], "correct": 0}
    ]
  },
  "writing": {
    "task1Prompt": "...",
    "task2Prompt": "..."
  },
  "speaking": {
    "part1Questions": ["...", "...", "..."],
    "part2Card": "...",
    "part3Questions": ["...", "...", "..."]
  }
}

LISTENING section rules:
- 2 speakers: Speaker A and Speaker B
- Academic context: university enrollment office, library orientation, student services, accommodation office, or study group
- 14-18 exchanges total, each 1-3 sentences
- 6 multiple-choice questions testing key information from the conversation
- "correct" is 0-based index

READING section rules:
- Academic passage, 200-250 words, topic varies per seed (science, environment, history, technology, social sciences)
- 8 multiple-choice questions
- "correct" is 0-based index

WRITING section rules:
- task1Prompt: describe a chart/table/graph in text form. Include the actual data as a text table. Example: "The table below shows the number of visitors to three museums in London between 2018 and 2022.\\n\\nMuseum | 2018 | 2019 | 2020\\nNatural History | 4.2m | 4.5m | 1.1m\\nScience | 3.3m | 3.6m | 0.9m\\nV&A | 2.9m | 3.1m | 0.8m\\n\\nSummarise the information, selecting and reporting the main features. Write at least 150 words."
- task2Prompt: opinion/discussion essay question requiring at least 250 words. Vary the topic (education, environment, technology, society).

SPEAKING section rules:
- part1Questions: 3 personal questions (work, study, hobbies) — short, direct
- part2Card: topic cue card with main prompt + 3 bullet points, newline-separated
- part3Questions: 3 abstract discussion questions extending the Part 2 topic`

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{ role: 'user', content: 'Generate the IELTS test now.' }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ error: 'Invalid response format' }, { status: 500 })

    const parsed = JSON.parse(jsonMatch[0])
    if (!parsed.listening?.conversation || !Array.isArray(parsed.listening.conversation)) {
      return NextResponse.json({ error: 'Invalid listening structure' }, { status: 500 })
    }
    return NextResponse.json(parsed)
  } catch (e) {
    console.error('IELTS generate error:', e)
    return NextResponse.json({ error: 'Failed to generate test' }, { status: 500 })
  }
}
