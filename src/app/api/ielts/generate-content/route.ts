import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { CLAUDE_HAIKU_MODEL } from '@/lib/constants'
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

    const systemPrompt = `You are an IELTS Academic test generator (reading, writing, speaking sections). Session: ${seed}. Generate completely fresh academic content. Never repeat topics from previous sessions.
${avoidTopics}

Return ONLY valid JSON matching this exact structure:

{
  "reading": {
    "passages": [
      {
        "passage": "...",
        "questions": [
          {"type": "mc",       "question": "...", "options": ["...","...","...","..."], "correct": 0},
          {"type": "tfng",     "question": "...", "options": ["True","False","Not Given"], "correct": 0},
          {"type": "matching", "question": "...", "options": ["...","...","...","..."], "correct": 0},
          {"type": "short",    "question": "...", "acceptedAnswers": ["...","..."]}
        ]
      }
    ]
  },
  "writing": {
    "task1Prompt": "...",
    "task2Prompt": "..."
  },
  "speaking": {
    "part1Questions": ["...", "...", "...", "...", "...", "...", "...", "..."],
    "part2Card": "...",
    "part3Questions": ["...", "...", "...", "..."]
  }
}

READING section rules:
- EXACTLY 3 passages. Each passage MAX 200 words on a DIFFERENT academic topic. Rotate across: science, environment, history, social science, technology, culture, medicine, psychology, economics, linguistics. Pick 3 different areas per seed. Never reuse specific subjects, case studies, or examples from previous sessions.
- Each passage has EXACTLY 8 questions, in this exact order and count:
  * items 1-3: "type":"mc" — 4 plausible options, "correct" is 0-based
  * items 4-5: "type":"tfng" — statement in "question", options EXACTLY ["True","False","Not Given"], "correct" 0-based (0=True, 1=False, 2=Not Given)
  * items 6-7: "type":"matching" — match a heading or statement to a paragraph/person. Options are 4 paragraph-labels or roles. "correct" is 0-based.
  * item 8: "type":"short" — one short-answer item; student types up to 3 words. "acceptedAnswers" is a list of 1-4 acceptable short phrases (lowercase, singular variants where relevant). Do NOT include "options" on short items.
- Do NOT include "options" on short items. Do NOT include "acceptedAnswers" on mc/tfng/matching items.
- 24 reading questions total across the 3 passages.

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
- part1Questions: EXACTLY 8 personal questions on DIFFERENT topics. Rotate through: work, study, hobbies, hometown, daily routine, technology, food, travel, family, sports, music, weather, shopping, weekends. Pick 8 different topics based on the seed. Keep questions short and direct, warm and conversational.
- part2Card: one topic cue card with a main prompt sentence + 3 bullet points using line breaks. Topics to rotate: environment, technology, education, culture, health, media, architecture, transportation, art, sport, food, travel, science. Pick one based on the seed that is NOT in the avoided topics list. Format:
  "Talk about [topic]. You should say:
  • [point 1]
  • [point 2]
  • [point 3]"
- part3Questions: EXACTLY 4 abstract discussion questions derived from and extending the Part 2 topic. Make them thought-provoking, intellectual, and debate-style — different from Part 1.`

    const response = await client.messages.create({
      model: CLAUDE_HAIKU_MODEL,
      max_tokens: 6000,
      system: systemPrompt,
      messages: [{ role: 'user', content: 'Generate the IELTS reading, writing, and speaking sections now.' }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ error: 'Invalid response format' }, { status: 500 })

    const parsed = JSON.parse(jsonMatch[0])
    if (!parsed.reading?.passages || !Array.isArray(parsed.reading.passages) || parsed.reading.passages.length < 3) {
      return NextResponse.json({ error: 'Invalid reading structure (expected 3 passages)' }, { status: 500 })
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
