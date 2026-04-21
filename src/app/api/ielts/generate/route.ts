import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `You are an IELTS test generator for Mongolian English learners (B1-C1 level).

Generate a complete IELTS-style mock test with these exact sections:

LISTENING: A short monologue or dialogue transcript (8-10 sentences). Then 6 multiple-choice questions about it. Each question has 4 options; "correct" is 0-based index.

READING: An academic-style passage (150-200 words) on a general interest topic. Then 8 multiple-choice questions. Same format as listening.

WRITING:
- Task 1: Ask the student to write at least 150 words describing a chart, graph, or process. Describe it in text (e.g. "The bar chart below shows...")
- Task 2: An essay question asking for opinion or discussion (e.g. "Some people believe... To what extent do you agree?"), write at least 250 words.

SPEAKING:
- Part 1: 3 personal questions (work, study, hobbies)
- Part 2: A topic card with a main prompt and 3 bullet points to cover in 1-2 minutes
- Part 3: 3 abstract discussion questions related to Part 2 topic

Return ONLY valid JSON, no extra text:
{
  "listening": {
    "transcript": "...",
    "questions": [{"question":"...","options":["A","B","C","D"],"correct":0}]
  },
  "reading": {
    "passage": "...",
    "questions": [{"question":"...","options":["A","B","C","D"],"correct":0}]
  },
  "writing": {
    "task1Prompt": "The bar chart below shows...",
    "task2Prompt": "Some people believe that..."
  },
  "speaking": {
    "part1Questions": ["Do you work or study?","What do you enjoy doing in your free time?","Do you prefer the city or the countryside?"],
    "part2Card": "Describe a memorable journey you have taken.\\nYou should say:\\n- where you went\\n- who you went with\\n- what you did there\\nand explain why it was memorable.",
    "part3Questions": ["Why do people travel?","How has tourism changed in recent years?","What are the negative effects of mass tourism?"]
  }
}`

export async function POST() {
  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: 'Generate the IELTS mock test now.' }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ error: 'Invalid response format' }, { status: 500 })

    const parsed = JSON.parse(jsonMatch[0])
    return NextResponse.json(parsed)
  } catch (e) {
    console.error('IELTS generate error:', e)
    return NextResponse.json({ error: 'Failed to generate test' }, { status: 500 })
  }
}
