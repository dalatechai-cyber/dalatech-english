import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({})) as { seed?: number; usedTopics?: string[] }
    const seed = body.seed ?? Date.now()
    const usedTopics = body.usedTopics ?? []

    const avoidTopics = usedTopics.length > 0
      ? `Previously used Part 2 topics to AVOID: ${usedTopics.join('; ')}. Choose a completely different topic.`
      : ''

    const systemPrompt = `You are an IELTS Academic test generator. Session seed: ${seed}.
${avoidTopics}
Generate completely fresh, unique content every time — never repeat questions from previous sessions.

Return ONLY valid JSON matching this exact structure:

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
    "part1Questions": ["...", "...", "...", "...", "..."],
    "part2Card": "...",
    "part3Questions": ["...", "...", "...", "..."]
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
- task1Prompt: describe a chart/table/graph. Include data using <data-table> tags exactly like this example:
  The table below shows annual coffee consumption (kg per person) in five countries from 2019 to 2022.

  <data-table>
  Country|2019|2020|2021|2022
  Finland|12.0|12.3|11.8|12.5
  Norway|9.9|10.1|9.7|10.4
  Netherlands|8.4|8.6|8.1|8.8
  Germany|6.7|6.9|6.5|7.0
  France|5.4|5.5|5.1|5.7
  </data-table>

  Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.

  Use this exact <data-table>...</data-table> format. Rows separated by newlines, columns separated by |. First row is the header.
- task2Prompt: opinion/discussion essay question requiring at least 250 words. Vary the topic (education, environment, technology, society). Never repeat topics.

SPEAKING section rules (seed ${seed} — make every session unique):
- part1Questions: exactly 5 personal questions on DIFFERENT topics. Rotate through: work, study, hobbies, hometown, daily routine, technology, food, travel, family, sports. Pick 5 different topics based on the seed. Keep questions short and direct.
- part2Card: one topic cue card with a main prompt sentence + 3 bullet points using line breaks. Topics to rotate: environment, technology, education, culture, health, media, architecture, transportation, art, sport, food, travel, science. Pick one based on the seed that is NOT in the avoided topics list. Format:
  "Talk about [topic]. You should say:
  • [point 1]
  • [point 2]
  • [point 3]"
- part3Questions: exactly 4 abstract discussion questions derived from and extending the Part 2 topic. Make them thought-provoking and different from Part 1.`

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
