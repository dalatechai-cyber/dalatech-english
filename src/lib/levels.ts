import type { LevelCode, LevelMeta } from './types'

export const LEVELS: LevelMeta[] = [
  {
    code: 'A1',
    label: 'А1 — Анхан шат',
    description: 'Үндсэн танилцуулга, угийн дарааллын зохион байгуулалт, энгийн өгүүлбэр',
    color: 'from-emerald-600 to-teal-700',
    lessons: [
      { id: 1,  title: 'To Be Verb',           titleMn: '"To Be" үйл үг',        description: 'I am, You are, He/She is ашиглах',           isExam: false },
      { id: 2,  title: 'Articles',              titleMn: 'Тодорхойлогч үг',       description: 'a, an, the хэрэглээ',                        isExam: false },
      { id: 3,  title: 'Possessives',           titleMn: 'Өмчлөлийн төлөөний үг', description: 'My, Your, His, Her, Its, Our, Their',        isExam: false },
      { id: 4,  title: 'Plurals & Age',         titleMn: 'Олон тоо ба нас',       description: '-s/-es дагавар, нас хэлэх арга',             isExam: false },
      { id: 5,  title: 'Present Simple',        titleMn: 'Одоогийн цаг',          description: 'He/She/It + S дүрэм',                        isExam: false },
      { id: 6,  title: 'Prepositions of Time',  titleMn: 'Цагийн предлог',        description: 'at, on, in — цаг, өдөр, хэсэгт ашиглах',    isExam: false },
      { id: 7,  title: 'Wh- Questions',         titleMn: 'Асуух үгс',             description: 'What, Where, When, Who, How асуух',         isExam: false },
      { id: 8,  title: 'Food & Countable Nouns',titleMn: 'Хоол хүнс & тоолох нэр үг', description: 'Some, any, a bottle of гэх мэт',       isExam: false },
      { id: 9,  title: 'Can / Cannot',          titleMn: 'Can үйл үг',            description: 'Can + үндсэн үйл үг',                        isExam: false },
      { id: 10, title: 'A1 Level Exam',         titleMn: 'А1 Шалгалт',           description: '15 оноотой шалгалт — А2 нээх',              isExam: true  },
    ],
  },
  {
    code: 'A2',
    label: 'А2 — Суурь шат',
    description: 'Өнгөрсөн ба ирээдүй цаг, харьцуулах хэлбэр',
    color: 'from-blue-600 to-indigo-700',
    lessons: [
      { id: 1,  title: 'Present Continuous',    titleMn: 'Одоо болж буй үйлдэл',  description: 'am/is/are + -ing хэлбэр',                    isExam: false },
      { id: 2,  title: 'Was / Were',            titleMn: 'Was / Were',             description: 'Өнгөрсөн цагт To Be',                        isExam: false },
      { id: 3,  title: 'Past Simple',           titleMn: 'Энгийн өнгөрсөн цаг',   description: 'V2 хэлбэр, буруу үйл үгс',                  isExam: false },
      { id: 4,  title: 'Future Tense',          titleMn: 'Ирээдүй цаг',           description: 'will + V1, going to + V1',                   isExam: false },
      { id: 5,  title: 'Comparatives',          titleMn: 'Харьцуулах хэлбэр',     description: '-er/-est, more/most',                        isExam: false },
      { id: 6,  title: 'Adverbs of Frequency',  titleMn: 'Давтамжийн дайвар үг',  description: 'always, often, never байрлал',               isExam: false },
      { id: 7,  title: 'Prepositions of Place', titleMn: 'Байршлын предлог',       description: 'in, on, at, between, next to',               isExam: false },
      { id: 8,  title: 'Modal Verbs',           titleMn: 'Туслах үйл үгс',        description: 'should, must + V1',                          isExam: false },
      { id: 9,  title: 'Object Pronouns',       titleMn: 'Объектийн төлөөний үг', description: 'me, him, her, us, them',                     isExam: false },
      { id: 10, title: 'A2 Level Exam',         titleMn: 'А2 Шалгалт',            description: '15 оноотой шалгалт — В1 нээх',              isExam: true  },
    ],
  },
  {
    code: 'B1',
    label: 'В1 — Дунд шат',
    description: 'Нийлмэл цагийн хэлбэр, нөхцөлт өгүүлбэр, идэвхгүй байдал',
    color: 'from-violet-600 to-purple-700',
    lessons: [
      { id: 1,  title: 'Present Perfect vs Past',  titleMn: 'Present Perfect ба Past Simple', description: 'have/has + V3, тодорхой цагтай ялгаа',    isExam: false },
      { id: 2,  title: 'Past Continuous',           titleMn: 'Өнгөрсөн цагт болж байсан',      description: 'was/were + -ing',                         isExam: false },
      { id: 3,  title: 'First Conditional',         titleMn: '1-р нөхцөлт өгүүлбэр',           description: 'If + Present, will + V1',                 isExam: false },
      { id: 4,  title: 'Second Conditional',        titleMn: '2-р нөхцөлт өгүүлбэр',           description: 'If + Past, would + V1',                   isExam: false },
      { id: 5,  title: 'Passive Voice',             titleMn: 'Идэвхгүй байдал',                 description: 'To Be + V3',                              isExam: false },
      { id: 6,  title: 'Used To',                   titleMn: '"Used to" хэлбэр',                description: 'Өнгөрсөн зуршил',                         isExam: false },
      { id: 7,  title: 'Relative Clauses',          titleMn: 'Харьцааны заасан өгүүлбэр',       description: 'who, which, where',                       isExam: false },
      { id: 8,  title: 'Modals of Deduction',       titleMn: 'Дүгнэлтийн туслах үйл үгс',       description: "must be, might be, can't be",             isExam: false },
      { id: 9,  title: 'Gerunds & Infinitives',     titleMn: 'Герунд ба Инфинитив',              description: 'enjoy + -ing, want + to',                 isExam: false },
      { id: 10, title: 'B1 Level Exam',             titleMn: 'В1 Шалгалт',                      description: '15 оноотой шалгалт — В2 нээх',           isExam: true  },
    ],
  },
  {
    code: 'B2',
    label: 'В2 — Дэвшилтэт шат',
    description: 'IELTS бэлтгэл, нарийн дүрмүүд, академик хэл',
    color: 'from-rose-600 to-pink-700',
    lessons: [
      { id: 1,  title: 'Present Perfect Continuous', titleMn: 'Үргэлжилсэн Present Perfect',   description: 'have/has been + -ing',                    isExam: false },
      { id: 2,  title: 'Past Perfect',               titleMn: 'Өнгөрсөн цагийн нийлмэл',       description: 'had + V3, ерөнхий дарааллын дүрэм',      isExam: false },
      { id: 3,  title: 'Third Conditional',           titleMn: '3-р нөхцөлт өгүүлбэр',          description: 'If + had + V3, would have + V3',          isExam: false },
      { id: 4,  title: 'Causative Have/Get',          titleMn: 'Causative хэлбэр',              description: 'have/get + obj + V3',                     isExam: false },
      { id: 5,  title: 'Reported Speech',             titleMn: 'Дамжуулсан яриа',               description: 'He said that... цагийн шилжилт',         isExam: false },
      { id: 6,  title: 'Past Modals',                titleMn: 'Өнгөрсөн цагийн туслах үйл үгс', description: "must have, should have, can't have",      isExam: false },
      { id: 7,  title: 'Advanced Linking Words',     titleMn: 'Дэвшилтэт холбоос үгс',          description: 'although, despite, in spite of',          isExam: false },
      { id: 8,  title: 'Wishes & Regrets',           titleMn: 'Хүсэл ба харамсал',              description: 'I wish + Past, I wish + Past Perfect',   isExam: false },
      { id: 9,  title: 'Idioms & Phrasal Verbs',     titleMn: 'Идиом ба Phrasal Verbs',         description: 'Байгалийн хэлц үгс, салгаж болох phrasal verb', isExam: false },
      { id: 10, title: 'B2 Level Exam',              titleMn: 'В2 Шалгалт',                     description: '15 оноотой шалгалт — С1 нээх',           isExam: true  },
    ],
  },
  {
    code: 'C1',
    label: 'С1 — Гүнзгий шат',
    description: 'IELTS 7.5+, инверси, хэв шинжийн сайжруулалт',
    color: 'from-amber-600 to-orange-700',
    lessons: [
      { id: 1,  title: 'Inversion',               titleMn: 'Урвуу дарааллын өгүүлбэр',      description: 'Never, Not only, Under no circumstances...',  isExam: false },
      { id: 2,  title: 'Mixed Conditionals',      titleMn: 'Холимог нөхцөлт өгүүлбэр',      description: 'If + Past Perfect, would + V1',               isExam: false },
      { id: 3,  title: 'Cleft Sentences',         titleMn: 'Cleft өгүүлбэр',                description: 'It is... who/that, What... is',               isExam: false },
      { id: 4,  title: 'Participle Clauses',      titleMn: 'Participial заасан өгүүлбэр',    description: 'Having done, Being done...',                  isExam: false },
      { id: 5,  title: 'Advanced Passive',        titleMn: 'Дэвшилтэт идэвхгүй байдал',     description: 'is said/believed to have + V3',               isExam: false },
      { id: 6,  title: 'Subjunctive Mood',        titleMn: 'Хослогдсон хэлбэр (Subjunctive)', description: 'demand/insist/suggest + that + bare infinitive', isExam: false },
      { id: 7,  title: 'Nuanced Modals',         titleMn: 'Нарийн туслах үйл үгс',          description: 'bound to, may well, the odds are',            isExam: false },
      { id: 8,  title: 'Academic Linking',        titleMn: 'Академик холбоос',               description: 'albeit, notwithstanding + noun/-ing',         isExam: false },
      { id: 9,  title: 'Advanced Collocations',  titleMn: 'Дэвшилтэт хэлц үгс',            description: 'C1 түвшний хүчтэй хэлц үгс',                 isExam: false },
      { id: 10, title: 'C1 Mastery Exam',        titleMn: 'С1 Эзэмшлийн шалгалт',          description: 'Дүрэм + хэв шинж + нэгдлийн шалгалт',       isExam: true  },
    ],
  },
]

export const LEVEL_CODES: LevelCode[] = ['A1', 'A2', 'B1', 'B2', 'C1']

export function getLevelMeta(code: string): LevelMeta | undefined {
  return LEVELS.find(l => l.code === code)
}

export function getLessonMeta(levelCode: string, lessonId: number) {
  const level = getLevelMeta(levelCode)
  return level?.lessons.find(l => l.id === lessonId)
}
