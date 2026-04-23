import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { CLAUDE_MODEL } from '@/lib/constants'
import { checkRateLimit } from '@/lib/rateLimit'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const limited = await checkRateLimit(req, 'ielts-generate')
  if (limited) return limited
  try {
    const body = await req.json().catch(() => null) as { seed?: number; usedTopics?: unknown } | null
    if (!body) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    const seed = typeof body.seed === 'number' ? body.seed : Date.now()
    const rawTopics = Array.isArray(body.usedTopics) ? body.usedTopics : []
    const usedTopics = rawTopics
      .slice(0, 10)
      .filter((t): t is string => typeof t === 'string')
      .map(t => t.slice(0, 60))

    const avoidTopics = usedTopics.length > 0
      ? `Previously used Part 2 topics to AVOID: ${usedTopics.join('; ')}. Choose a completely different topic.`
      : ''

    const systemPrompt = `You are an IELTS Academic test generator (reading, writing, speaking sections). Session seed: ${seed}.
${avoidTopics}
Generate completely fresh, unique content every time — never repeat questions from previous sessions.

Return ONLY valid JSON matching this exact structure:

{
  "reading": {
    "passages": [
      {
        "passage": "...",
        "questions": [
          {"question": "...", "options": ["A","B","C","D"], "correct": 0}
        ]
      },
      {
        "passage": "...",
        "questions": [
          {"question": "...", "options": ["A","B","C","D"], "correct": 0}
        ]
      }
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

READING section rules:
- Exactly 2 passages. Each passage 250-300 words on a DIFFERENT academic topic (e.g., passage 1 science/environment, passage 2 history/social sciences/technology/culture). Vary topics per seed so no two sessions share a topic. The passage topics MUST be fresh — never reuse specific subjects, case studies, or examples from likely previous sessions.
- Passage 1: 5 questions — MIX of multiple-choice and True/False/Not Given. For True/False/Not Given items, put the statement in "question" and use options ["True","False","Not Given"] with "correct" being the 0-based index.
- Passage 2: 5 questions — MIX of multiple-choice and matching (e.g. match a statement to the paragraph/person that expresses it). Use 4 options for multiple-choice and matching items.
- 10 reading questions total across the 2 passages. "correct" is always a 0-based index into the options array for that question.

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
      model: CLAUDE_MODEL,
      max_tokens: 3500,
      system: systemPrompt,
      messages: [{ role: 'user', content: 'Generate the IELTS reading, writing, and speaking sections now.' }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ error: 'Invalid response format' }, { status: 500 })

    const parsed = JSON.parse(jsonMatch[0])
    if (!parsed.reading?.passages || !Array.isArray(parsed.reading.passages) || parsed.reading.passages.length < 2) {
      return NextResponse.json({ error: 'Invalid reading structure' }, { status: 500 })
    }
    if (!parsed.writing || !parsed.speaking) {
      return NextResponse.json({ error: 'Invalid content structure' }, { status: 500 })
    }
    return NextResponse.json(parsed)
  } catch (e) {
    console.error('IELTS generate-content error:', e)
    return NextResponse.json({ error: 'Failed to generate content' }, { status: 500 })
  }
}
