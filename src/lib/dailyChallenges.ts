export interface DailyChallengeQ {
  id: number
  level: string
  type: 'mc' | 'fill'
  question: string
  options?: string[]
  correct: number | string
  explanation: string
}

export const CHALLENGES: DailyChallengeQ[] = [
  // A1 MC
  { id: 1, level: 'A1', type: 'mc', question: 'I ___ a student.', options: ['am', 'is', 'are', 'be'], correct: 0, explanation: '"I"-тай хамт "am" хэрэглэнэ.' },
  { id: 2, level: 'A1', type: 'mc', question: 'She ___ from Mongolia.', options: ['am', 'is', 'are', 'be'], correct: 1, explanation: '"She"-тай хамт "is" хэрэглэнэ.' },
  { id: 3, level: 'A1', type: 'mc', question: 'Choose the correct article: ___ apple.', options: ['a', 'an', 'the', 'no article'], correct: 1, explanation: 'Эгшгээр эхэлсэн үгийн өмнө "an" хэрэглэнэ.' },
  { id: 4, level: 'A1', type: 'mc', question: 'I have ___ cats.', options: ['two', 'twos', 'second', 'twice'], correct: 0, explanation: 'Тоо лавлахаар "two" хэрэглэнэ.' },
  { id: 5, level: 'A1', type: 'mc', question: 'She ___ English every day.', options: ['study', 'studies', 'studys', 'studying'], correct: 1, explanation: 'He/She/It-тай Present Simple-д үйл үгэнд -s/-es нэмнэ.' },
  { id: 6, level: 'A1', type: 'fill', question: 'I have 20 ___. (нас)', correct: 'years old', explanation: '"I am 20 years old" мөн хэрэглэж болно. "I have 20 years" буруу.' },
  { id: 7, level: 'A1', type: 'mc', question: 'They ___ students.', options: ['is', 'am', 'are', 'be'], correct: 2, explanation: '"They"-тай хамт "are" хэрэглэнэ.' },
  { id: 8, level: 'A1', type: 'mc', question: 'I ___ swim very well.', options: ['can', 'cans', 'am can', 'is'], correct: 0, explanation: '"Can" туслах үйл үг — нэмэлт өөрчлөлтгүй хэрэглэнэ.' },
  { id: 9, level: 'A1', type: 'fill', question: 'This is ___ book. (нэг номын тухай)', correct: 'a', explanation: 'Нэг тодорхойгүй юмны өмнө "a" хэрэглэнэ.' },
  { id: 10, level: 'A1', type: 'mc', question: 'He ___ his homework at night.', options: ['does', 'do', 'doing', 'done'], correct: 0, explanation: '"He"-тай Present Simple-д "does" хэрэглэнэ.' },
  // A1 more
  { id: 11, level: 'A1', type: 'mc', question: 'My brother is a doctor. ___ works at a hospital.', options: ['She', 'He', 'They', 'It'], correct: 1, explanation: 'Эрэгтэй хүнийг "He" гэнэ.' },
  { id: 12, level: 'A1', type: 'mc', question: 'I get up ___ 7 o\'clock.', options: ['in', 'on', 'at', 'by'], correct: 2, explanation: 'Тодорхой цагийн өмнө "at" хэрэглэнэ.' },
  { id: 13, level: 'A1', type: 'fill', question: 'What ___ your name? (асуулт)', correct: 'is', explanation: '"What is your name?" — "is" хэрэглэнэ.' },
  // A2 MC
  { id: 14, level: 'A2', type: 'mc', question: 'She ___ TV when I called.', options: ['watches', 'watched', 'was watching', 'is watching'], correct: 2, explanation: 'Дуудлага хийх үед болж байсан үйлдэлд Past Continuous хэрэглэнэ.' },
  { id: 15, level: 'A2', type: 'mc', question: 'I ___ to Paris last summer.', options: ['go', 'gone', 'went', 'have gone'], correct: 2, explanation: '"Last summer" тодорхой өнгөрсөн цаг — Past Simple хэрэглэнэ.' },
  { id: 16, level: 'A2', type: 'mc', question: 'Tomorrow I ___ visit my grandparents.', options: ['will', 'would', 'am going', 'shall to'], correct: 0, explanation: 'Ирээдүйн шийдвэрт "will" хэрэглэнэ.' },
  { id: 17, level: 'A2', type: 'mc', question: 'My car is ___ than yours.', options: ['fast', 'more fast', 'faster', 'fastest'], correct: 2, explanation: 'Богино тэмдэг нэрийн харьцуулахад -er нэмнэ.' },
  { id: 18, level: 'A2', type: 'mc', question: 'I ___ usually wake up early.', options: ['am', 'do', 'does', '—'], correct: 3, explanation: '"Usually" давтамжийн дайвар үг нь үйл үгийн өмнө ирдэг: "I usually wake up".' },
  { id: 19, level: 'A2', type: 'fill', question: 'You ___ eat more vegetables. (зөвлөмж)', correct: 'should', explanation: '"Should" зөвлөмжид хэрэглэгддэг туслах үйл үг.' },
  { id: 20, level: 'A2', type: 'mc', question: 'The book is ___ the table.', options: ['in', 'at', 'on', 'by'], correct: 2, explanation: 'Хавтгай гадаргуун дээр буй зүйлд "on" хэрэглэнэ.' },
  { id: 21, level: 'A2', type: 'mc', question: 'I didn\'t ___ to the party.', options: ['go', 'went', 'gone', 'going'], correct: 0, explanation: '"Didn\'t" дараа нь үйл үгийн үндсэн хэлбэр (base form) хэрэглэнэ.' },
  { id: 22, level: 'A2', type: 'mc', question: 'She was ___ when I arrived.', options: ['sleep', 'slept', 'sleeping', 'sleeps'], correct: 2, explanation: 'Past Continuous: was/were + verb-ing.' },
  { id: 23, level: 'A2', type: 'fill', question: 'Give it to ___. (me/I)', correct: 'me', explanation: '"To" предлогийн дараа объектийн хэлбэр "me" хэрэглэнэ.' },
  // B1
  { id: 24, level: 'B1', type: 'mc', question: 'I ___ never been to Japan.', options: ['have', 'has', 'had', 'did'], correct: 0, explanation: '"I"-тай Present Perfect: "have + past participle".' },
  { id: 25, level: 'B1', type: 'mc', question: 'If it rains, I ___ stay home.', options: ['will', 'would', 'shall', 'can'], correct: 0, explanation: 'First Conditional: if + Present Simple, will + base verb.' },
  { id: 26, level: 'B1', type: 'mc', question: 'The letter was ___ by my friend.', options: ['write', 'wrote', 'written', 'writing'], correct: 2, explanation: 'Passive Voice: was/were + past participle.' },
  { id: 27, level: 'B1', type: 'mc', question: 'She is the woman ___ helped me.', options: ['which', 'whose', 'who', 'what'], correct: 2, explanation: 'Хүнийг харьцааны өгүүлбэрт "who" хэрэглэнэ.' },
  { id: 28, level: 'B1', type: 'mc', question: 'I ___ play football as a child.', options: ['was used to', 'used to', 'am used to', 'use to'], correct: 1, explanation: '"Used to" өнгөрсөн дадал, үйлдлийг илэрхийлдэг.' },
  { id: 29, level: 'B1', type: 'mc', question: 'He ___ be a doctor — he has a stethoscope.', options: ['can\'t', 'mustn\'t', 'must', 'should'], correct: 2, explanation: '"Must be" — бараг тодорхой дүгнэлтэд хэрэглэнэ.' },
  { id: 30, level: 'B1', type: 'fill', question: 'I enjoy ___ (swim) in the ocean.', correct: 'swimming', explanation: '"Enjoy" үйл үгийн дараа герунд (-ing хэлбэр) хэрэглэнэ.' },
  { id: 31, level: 'B1', type: 'mc', question: 'If I ___ rich, I would travel the world.', options: ['am', 'were', 'was', 'be'], correct: 1, explanation: 'Second Conditional: if + Past Simple (were), would + base verb.' },
  { id: 32, level: 'B1', type: 'mc', question: 'I went to Paris ___ 2022.', options: ['for', 'since', 'in', 'on'], correct: 2, explanation: 'Жилийн өмнө "in" хэрэглэнэ.' },
  { id: 33, level: 'B1', type: 'fill', question: 'I ___ never visited China. (Present Perfect)', correct: 'have', explanation: '"I have never visited China" — Present Perfect with "never".' },
  // B2
  { id: 34, level: 'B2', type: 'mc', question: 'She ___ living here for 10 years.', options: ['is', 'has been', 'was', 'have been'], correct: 1, explanation: '"For 10 years" + Present Perfect Continuous: "has been living".' },
  { id: 35, level: 'B2', type: 'mc', question: 'If I had studied harder, I ___ passed the exam.', options: ['would have', 'will have', 'would', 'had'], correct: 0, explanation: 'Third Conditional: if + Past Perfect, would have + past participle.' },
  { id: 36, level: 'B2', type: 'mc', question: 'I ___ my hair cut yesterday.', options: ['cut', 'had', 'got cut', 'have cut'], correct: 1, explanation: 'Causative: "I had my hair cut" — бусдаар гүйцэтгүүлсэн.' },
  { id: 37, level: 'B2', type: 'mc', question: 'He said he ___ come the next day.', options: ['will', 'would', 'shall', 'can'], correct: 1, explanation: 'Reported Speech: "will" → "would" болж өөрчлөгддөг.' },
  { id: 38, level: 'B2', type: 'mc', question: '___ of the difficulty, she finished the task.', options: ['Despite of', 'In spite', 'Despite', 'Although'], correct: 2, explanation: '"Despite" + нэр үг/герунд — "Despite of" буруу!' },
  { id: 39, level: 'B2', type: 'mc', question: 'I wish I ___ speak Chinese.', options: ['can', 'could', 'would', 'am able to'], correct: 1, explanation: '"I wish" + Past Simple (could) — одоогийн хүсэл.' },
  { id: 40, level: 'B2', type: 'mc', question: 'He ___ have taken the wrong bus — he is very late.', options: ['must', 'should', 'can\'t', 'mustn\'t'], correct: 0, explanation: '"Must have" — өнгөрсөн цагт тодорхой дүгнэлт.' },
  { id: 41, level: 'B2', type: 'fill', question: 'By the time I arrived, she ___ (already leave) left.', correct: 'had already left', explanation: 'Past Perfect — өмнө болсон үйлдэлд хэрэглэнэ.' },
  { id: 42, level: 'B2', type: 'mc', question: 'I ___ pick it up. (phrasal verb — авах)', options: ['pick up it', 'pick it up', 'pick it', 'up pick it'], correct: 1, explanation: 'Тэмдэгт хэлэх phrasal verb: "pick it up" — төлөөний үг дунд орно.' },
  { id: 43, level: 'B2', type: 'mc', question: 'He told ___ the truth.', options: ['me', 'to me', 'I', 'to I'], correct: 0, explanation: '"Tell" + объект (me) + юу хэлснийг: "He told me".' },
  // C1
  { id: 44, level: 'C1', type: 'mc', question: 'Never ___ such a beautiful sunset.', options: ['I have seen', 'have I seen', 'I saw', 'saw I'], correct: 1, explanation: 'Inversion: "Never have I seen" — сөрөг дайвар үгийн дараа урвуу дараалал.' },
  { id: 45, level: 'C1', type: 'mc', question: 'If I had studied medicine, I ___ a doctor now.', options: ['would be', 'would have been', 'will be', 'am'], correct: 0, explanation: 'Mixed Conditional: if + Past Perfect → would + base verb (present result).' },
  { id: 46, level: 'C1', type: 'mc', question: '___ down the street, I heard a strange noise.', options: ['Walk', 'While walk', 'Walking', 'Walked'], correct: 2, explanation: 'Participle Clause: "Walking down the street, I heard..."' },
  { id: 47, level: 'C1', type: 'mc', question: 'The committee insisted that he ___ present.', options: ['is', 'was', 'be', 'being'], correct: 2, explanation: 'Subjunctive: "insist that + bare infinitive" — "be" хэрэглэнэ.' },
  { id: 48, level: 'C1', type: 'mc', question: 'What I need ___ more practice.', options: ['it is', 'is', 'are', 'it are'], correct: 1, explanation: 'Cleft sentence: "What I need is..." — давхар төлөөний үг буруу.' },
  { id: 49, level: 'C1', type: 'mc', question: 'Not only ___ but he also missed the deadline.', options: ['he lied', 'lied he', 'did he lie', 'he did lie'], correct: 2, explanation: '"Not only" дараа inversion: "did he lie".' },
  { id: 50, level: 'C1', type: 'fill', question: '"Very tired" гэсний оронд C1 үгийг бич.', correct: 'exhausted', explanation: '"Exhausted" = "very tired" гэсний C1 хувилбар.' },
  // More A1
  { id: 51, level: 'A1', type: 'mc', question: 'I work ___ Mondays.', options: ['in', 'on', 'at', 'by'], correct: 1, explanation: 'Гарагийн өмнө "on" хэрэглэнэ.' },
  { id: 52, level: 'A1', type: 'mc', question: 'She has ___ umbrella.', options: ['a', 'an', 'the', 'some'], correct: 1, explanation: '"Umbrella" эгшгээр эхэлдэг — "an" хэрэглэнэ.' },
  { id: 53, level: 'A1', type: 'fill', question: 'He ___ not like coffee. (does/do)', correct: 'does', explanation: '"He" 3-р биетэй — "does not" хэрэглэнэ.' },
  { id: 54, level: 'A1', type: 'mc', question: 'How old ___ you?', options: ['is', 'am', 'are', 'be'], correct: 2, explanation: '"You"-тай "are" хэрэглэнэ.' },
  { id: 55, level: 'A1', type: 'mc', question: 'I have two ___. (cat)', options: ['cat', 'cats', 'cates', 'catses'], correct: 1, explanation: 'Олон тоод -s нэмнэ.' },
  // More A2
  { id: 56, level: 'A2', type: 'mc', question: 'She is ___ beautiful than her sister.', options: ['more', 'most', 'much more', 'very more'], correct: 0, explanation: 'Урт тэмдэг нэрийн харьцуулахад "more" хэрэглэнэ.' },
  { id: 57, level: 'A2', type: 'mc', question: 'I ___ born in 2000.', options: ['was', 'were', 'am', 'have been'], correct: 0, explanation: '"I was born" — төрсөн огноо Past Simple.' },
  { id: 58, level: 'A2', type: 'fill', question: 'She ___ (go) to school yesterday.', correct: 'went', explanation: '"Go"-ийн Past Simple хэлбэр "went".' },
  { id: 59, level: 'A2', type: 'mc', question: 'You ___ smoke here. It is not allowed.', options: ['mustn\'t', 'don\'t have to', 'shouldn\'t have', 'couldn\'t'], correct: 0, explanation: '"Mustn\'t" хориглолтыг илэрхийлнэ.' },
  { id: 60, level: 'A2', type: 'mc', question: 'I always ___ breakfast at 7 AM.', options: ['has', 'have', 'having', 'had'], correct: 1, explanation: 'I-тай Present Simple: "have".' },
  // More B1
  { id: 61, level: 'B1', type: 'mc', question: 'The window ___ by accident.', options: ['broke', 'was broke', 'was broken', 'has broke'], correct: 2, explanation: 'Passive Voice: was + past participle → "was broken".' },
  { id: 62, level: 'B1', type: 'mc', question: 'The man ___ I met was very kind.', options: ['which', 'what', 'who', 'whose'], correct: 2, explanation: 'Хүний тухай Relative Clause: "who".' },
  { id: 63, level: 'B1', type: 'fill', question: 'I plan ___ (study) abroad next year.', correct: 'to study', explanation: '"Plan" үйл үгийн дараа "to + infinitive" хэрэглэнэ.' },
  { id: 64, level: 'B1', type: 'mc', question: 'She ___ gone to university — she has a degree.', options: ['must have', 'can\'t have', 'might have', 'should have'], correct: 0, explanation: '"Must have" — тодорхой өнгөрсөн дүгнэлт.' },
  { id: 65, level: 'B1', type: 'mc', question: 'He didn\'t go out ___ the rain.', options: ['although', 'because', 'because of', 'despite of'], correct: 2, explanation: '"Because of" + нэр үг — учир шалтгааныг илэрхийлнэ.' },
  // More B2
  { id: 66, level: 'B2', type: 'mc', question: 'She ___ studying for 3 hours by the time I arrived.', options: ['was', 'has been', 'had been', 'is'], correct: 2, explanation: 'Past Perfect Continuous — урт хугацааны өнгөрсөн үйлдэл.' },
  { id: 67, level: 'B2', type: 'mc', question: '"I am tired," he said. → He said ___.', options: ['he is tired', 'he was tired', 'I was tired', 'I am tired'], correct: 1, explanation: 'Reported Speech: "am" → "was" болно.' },
  { id: 68, level: 'B2', type: 'mc', question: 'I wish I ___ taken that opportunity.', options: ['had', 'have', 'would have', 'could'], correct: 0, explanation: '"I wish + Past Perfect" — өнгөрсөн харамсал.' },
  { id: 69, level: 'B2', type: 'fill', question: 'She had her car ___ (fix) at the garage.', correct: 'fixed', explanation: 'Causative "have": "had her car fixed".' },
  { id: 70, level: 'B2', type: 'mc', question: 'She ___ have finished the report — it\'s not on the desk.', options: ['must', 'can\'t', 'could', 'might not'], correct: 1, explanation: '"Can\'t have" — өнгөрсөн цагт боломжгүй зүйл.' },
  // More C1
  { id: 71, level: 'C1', type: 'mc', question: 'Rarely ___ seen such dedication.', options: ['I have', 'have I', 'I had', 'had I'], correct: 1, explanation: '"Rarely" дараа inversion: auxiliary + subject.' },
  { id: 72, level: 'C1', type: 'mc', question: 'It was ___ that discovered penicillin.', options: ['Fleming who', 'Fleming which', 'Fleming', 'who Fleming'], correct: 0, explanation: 'Cleft sentence: "It was Fleming who..."' },
  { id: 73, level: 'C1', type: 'fill', question: 'She required that he ___ (be) present. (subjunctive)', correct: 'be', explanation: '"Require that" + bare infinitive — Subjunctive Mood.' },
  { id: 74, level: 'C1', type: 'mc', question: 'Under no circumstances ___ leave early.', options: ['you should', 'should you', 'you must', 'must you'], correct: 1, explanation: '"Under no circumstances" дараа inversion: "should you".' },
  { id: 75, level: 'C1', type: 'mc', question: 'Having ___ the report, she submitted it.', options: ['finish', 'finished', 'finishing', 'finishes'], correct: 1, explanation: '"Having + past participle" — Perfect Participle Clause.' },
  { id: 76, level: 'C1', type: 'mc', question: '"Very big problem" гэсний оронд C1 хэлбэр:', options: ['pressing issue', 'big issue', 'very pressing problem', 'much big problem'], correct: 0, explanation: '"Pressing issue" = "very big problem" гэсний C1 collocation.' },
  // Filler questions to reach 100
  { id: 77, level: 'A1', type: 'mc', question: '___ your name? (Таны нэр?)', options: ['What is', 'What are', 'How is', 'What am'], correct: 0, explanation: '"What is your name?" — нэрийг асуух стандарт хэлбэр.' },
  { id: 78, level: 'A1', type: 'mc', question: 'She ___ a teacher.', options: ['am', 'is', 'are', 'be'], correct: 1, explanation: '"She"-тай "is" хэрэглэнэ.' },
  { id: 79, level: 'A2', type: 'mc', question: 'It\'s the ___ movie I\'ve ever seen! (superlative)', options: ['good', 'better', 'best', 'most good'], correct: 2, explanation: '"Good"-ийн дээд зэрэг: "best".' },
  { id: 80, level: 'A2', type: 'fill', question: 'I ___ (not go) to school yesterday.', correct: "didn't go", explanation: '"Didn\'t go" — Past Simple сөрөг хэлбэр.' },
  { id: 81, level: 'B1', type: 'mc', question: 'I have lived here ___ 2018.', options: ['for', 'since', 'in', 'from'], correct: 1, explanation: '"Since" тодорхой цагийн нэрийн өмнө хэрэглэнэ.' },
  { id: 82, level: 'B1', type: 'mc', question: 'I avoid ___ by bus. (travel)', options: ['travel', 'to travel', 'travelling', 'traveled'], correct: 2, explanation: '"Avoid" дараа герунд (-ing) хэрэглэнэ.' },
  { id: 83, level: 'B2', type: 'mc', question: 'The project ___ before the deadline.', options: ['had been completed', 'was completed', 'completed', 'has completed'], correct: 0, explanation: 'Past Perfect Passive: "had been completed".' },
  { id: 84, level: 'B2', type: 'mc', question: '"I will call you," she said. → She said ___', options: ['she would call me', 'she will call me', 'I would call you', 'she called me'], correct: 0, explanation: 'Reported Speech: "will" → "would", "you" → "me".' },
  { id: 85, level: 'C1', type: 'mc', question: '___ the task challenging, she completed it.', options: ['Found', 'Finding', 'Having found', 'She found'], correct: 1, explanation: 'Participle Clause: "Finding the task challenging, she completed it."' },
  { id: 86, level: 'A1', type: 'mc', question: 'There ___ many students in my class.', options: ['is', 'am', 'are', 'be'], correct: 2, explanation: '"There are" олон тоотой хэрэглэнэ.' },
  { id: 87, level: 'A1', type: 'fill', question: 'I wake up ___ 6 in the morning.', correct: 'at', explanation: '"At" тодорхой цагийн өмнө хэрэглэнэ.' },
  { id: 88, level: 'A2', type: 'mc', question: 'He ___ football every weekend.', options: ['play', 'plays', 'is playing', 'played'], correct: 1, explanation: '"He"-тай Present Simple: "plays".' },
  { id: 89, level: 'B1', type: 'mc', question: 'The book ___ by Tolkien is amazing.', options: ['writing', 'written', 'wrote', 'writes'], correct: 1, explanation: 'Reduced Passive Relative Clause: "written by".' },
  { id: 90, level: 'B2', type: 'mc', question: 'She ___ for ages before getting a response.', options: ['was waiting', 'waited', 'had been waiting', 'has waited'], correct: 2, explanation: 'Past Perfect Continuous: "had been waiting".' },
  { id: 91, level: 'C1', type: 'mc', question: 'Not until midnight ___ he realize his mistake.', options: ['he did', 'did he', 'he had', 'had he'], correct: 1, explanation: '"Not until" дараа inversion: "did he realize".' },
  { id: 92, level: 'A2', type: 'mc', question: 'Where ___ yesterday afternoon?', options: ['were you', 'you were', 'was you', 'you was'], correct: 0, explanation: 'Was/Were асуулт: "Where were you?"' },
  { id: 93, level: 'B1', type: 'mc', question: 'It is made ___ plastic.', options: ['of', 'from', 'with', 'by'], correct: 0, explanation: '"Made of" — материалын тухай.' },
  { id: 94, level: 'B2', type: 'fill', question: 'Despite the ___  (difficulty), she passed.', correct: 'difficulty', explanation: '"Despite" + нэр үг. "Despite of" буруу!' },
  { id: 95, level: 'C1', type: 'mc', question: '"Very happy" гэсний C1 synonym:', options: ['elated', 'very elated', 'much happy', 'very joyful'], correct: 0, explanation: '"Elated" = "very happy" гэсний дэвшилтэт үг.' },
  { id: 96, level: 'A1', type: 'mc', question: 'I can\'t ___ French.', options: ['to speak', 'speaking', 'speak', 'spoke'], correct: 2, explanation: '"Can\'t" дараа үйл үгийн үндсэн хэлбэр (base form) хэрэглэнэ.' },
  { id: 97, level: 'A2', type: 'mc', question: 'He is ___ intelligent than his brother.', options: ['very', 'more', 'most', 'much'], correct: 1, explanation: 'Харьцуулахад "more" хэрэглэнэ.' },
  { id: 98, level: 'B1', type: 'mc', question: 'I\'ve lived here ___ 5 years.', options: ['since', 'for', 'during', 'in'], correct: 1, explanation: '"For" хугацааны урттай хэрэглэнэ.' },
  { id: 99, level: 'B2', type: 'mc', question: 'He told ___ not to worry.', options: ['me', 'to me', 'I', 'my'], correct: 0, explanation: '"Tell + object": "He told me".' },
  { id: 100, level: 'C1', type: 'fill', question: '"Very big" гэсний C1 alternative (adjective for impact):', correct: 'immense', explanation: '"Immense" = "very big" — дэвшилтэт тэмдэг нэр.' },
]

const DAILY_KEY = 'core-daily-challenge'
const DAILY_DATE_KEY = 'core-daily-challenge-date'

export function getDailyChallenge(): DailyChallengeQ {
  const today = new Date().toISOString().slice(0, 10)
  const parts = today.split('-')
  const seed = parseInt(parts[0]) * 10000 + parseInt(parts[1]) * 100 + parseInt(parts[2])
  const index = seed % CHALLENGES.length
  return CHALLENGES[index]
}

export function isDailyCompleted(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(DAILY_DATE_KEY) === new Date().toISOString().slice(0, 10)
}

export function markDailyCompleted(): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(DAILY_DATE_KEY, new Date().toISOString().slice(0, 10))
}

export function getDailyAnswer(): string | null {
  if (typeof window === 'undefined') return null
  const date = localStorage.getItem(DAILY_DATE_KEY)
  if (date !== new Date().toISOString().slice(0, 10)) return null
  return localStorage.getItem(DAILY_KEY)
}

export function saveDailyAnswer(answer: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(DAILY_KEY, answer)
  markDailyCompleted()
}
