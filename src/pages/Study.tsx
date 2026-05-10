import { useState, useRef } from 'react'

const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY as string

const SUBJECTS = ['מתמטיקה', 'אנגלית', 'עברית', 'מדעים', 'היסטוריה', 'תנ״ך', 'ספרות', 'אחר']

const card: React.CSSProperties = {
  background: 'var(--surface)',
  borderRadius: '24px',
  border: '1px solid var(--border)',
  boxShadow: '0 4px 18px var(--shadow)',
  boxSizing: 'border-box',
  width: '100%',
  transition: 'background-color 0.3s ease',
}

type Step = 1 | 2 | 3 | 4

interface StudyStep {
  title: string
  explanation: string
  exercise: string
}

interface QuizQuestion {
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
}

async function callClaude(messages: { role: string; content: string }[], system: string): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system,
      messages,
    }),
  })
  if (!res.ok) throw new Error('API error')
  const data = await res.json()
  return data.content[0].text as string
}

function extractJSON(text: string): unknown {
  const match = text.match(/```json\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/)
  if (match) {
    try { return JSON.parse(match[1] || match[0]) } catch { /* fall through */ }
  }
  try { return JSON.parse(text) } catch { return null }
}

export default function Study() {
  const [step, setStep] = useState<Step>(1)
  const [subject, setSubject] = useState(SUBJECTS[0])
  const [pastedText, setPastedText] = useState('')
  const [fileName, setFileName] = useState('')
  const [fileContent, setFileContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [chatMessages, setChatMessages] = useState<{ role: string; content: string }[]>([])
  const [userInput, setUserInput] = useState('')
  const [studyPlan, setStudyPlan] = useState<StudyStep[]>([])
  const [doneSteps, setDoneSteps] = useState<boolean[]>([])
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([])
  const [selectedAnswers, setSelectedAnswers] = useState<(number | null)[]>([])
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [studentLevel, setStudentLevel] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const material = fileContent || pastedText

  function handleFile(file: File) {
    setFileName(file.name)
    const reader = new FileReader()
    if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
      reader.onload = e => {
        const base64 = (e.target?.result as string).split(',')[1]
        setFileContent(`[קובץ: ${file.name}]\n[תוכן בסיס64: ${base64.slice(0, 200)}...]`)
      }
      reader.readAsDataURL(file)
    } else {
      reader.onload = e => setFileContent(e.target?.result as string ?? '')
      reader.readAsText(file)
    }
  }

  async function startStudy() {
    if (!material.trim()) { setError('נא להעלות קובץ או להדביק טקסט'); return }
    setError('')
    setLoading(true)
    setStep(2)
    try {
      const system = `אתה מורה חכם, סבלני ומעודד לתלמידי חטיבת ביניים בישראל. דבר תמיד בעברית בטון חברי וצעיר. המשימה שלך: 1) זהה את הנושא והנושאי משנה בחומר 2) שאל את התלמיד מה הרמה שלו בנושא (מתחיל/בינוני/מתקדם) 3) שאל אם יש משהו ספציפי שהוא רוצה להתמקד בו. ענה בקצרה.`
      const userMsg = `נושא: ${subject}\n\nחומר הלימוד:\n${material.slice(0, 3000)}`
      const reply = await callClaude([{ role: 'user', content: userMsg }], system)
      setChatMessages([{ role: 'user', content: userMsg }, { role: 'assistant', content: reply }])
    } catch {
      setError('משהו השתבש, נסו שוב')
      setStep(1)
    } finally {
      setLoading(false)
    }
  }

  async function sendMessage() {
    if (!userInput.trim()) return
    const newMessages = [...chatMessages, { role: 'user', content: userInput }]
    setChatMessages(newMessages)
    setStudentLevel(userInput)
    setUserInput('')
    setLoading(true)
    try {
      const system = `אתה מורה חכם לתלמידי חטיבת ביניים. דבר בעברית בטון חברי. בנה תוכנית למידה מובנית עם 3-5 שלבים. לכל שלב: כותרת, הסבר קצר, ותרגיל אחד. התאם לרמת התלמיד. החזר JSON בלבד עם המבנה הבא: {"steps": [{"title": "...", "explanation": "...", "exercise": "..."}]}`
      const reply = await callClaude(newMessages, system)
      const parsed = extractJSON(reply) as { steps: StudyStep[] } | null
      if (parsed?.steps) {
        setStudyPlan(parsed.steps)
        setDoneSteps(new Array(parsed.steps.length).fill(false))
        setStep(3)
      } else {
        setChatMessages(prev => [...prev, { role: 'assistant', content: reply }])
      }
    } catch {
      setError('משהו השתבש, נסו שוב')
    } finally {
      setLoading(false)
    }
  }

  async function generateQuiz() {
    setLoading(true)
    setStep(4)
    setQuizSubmitted(false)
    try {
      const system = `צור מבחן של 5-7 שאלות על החומר. החזר JSON בלבד עם המבנה: {"questions": [{"question": "...", "options": ["א","ב","ג","ד"], "correctAnswer": 0, "explanation": "..."}]}. התאם לרמת: ${studentLevel || 'בינוני'}.`
      const reply = await callClaude(
        [{ role: 'user', content: `נושא: ${subject}\nחומר:\n${material.slice(0, 2000)}` }],
        system
      )
      const parsed = extractJSON(reply) as { questions: QuizQuestion[] } | null
      if (parsed?.questions) {
        setQuizQuestions(parsed.questions)
        setSelectedAnswers(new Array(parsed.questions.length).fill(null))
      } else {
        setError('לא הצלחנו לייצר מבחן, נסו שוב')
        setStep(3)
      }
    } catch {
      setError('משהו השתבש, נסו שוב')
      setStep(3)
    } finally {
      setLoading(false)
    }
  }

  function submitQuiz() {
    if (selectedAnswers.includes(null)) { setError('יש לענות על כל השאלות'); return }
    setError('')
    setQuizSubmitted(true)
  }

  const score = quizSubmitted
    ? quizQuestions.filter((q, i) => selectedAnswers[i] === q.correctAnswer).length
    : 0
  const pct = quizQuestions.length ? Math.round((score / quizQuestions.length) * 100) : 0

  function resetAll() {
    setStep(1); setPastedText(''); setFileName(''); setFileContent('')
    setChatMessages([]); setStudyPlan([]); setDoneSteps([])
    setQuizQuestions([]); setSelectedAnswers([]); setQuizSubmitted(false)
    setStudentLevel(''); setError('')
  }

  const STEP_LABELS = ['העלאת חומר', 'שיחה עם הבאדי', 'תוכנית למידה', 'מבחן']

  return (
    <div className="fade-in" style={{ maxWidth: '720px', margin: '0 auto', padding: '24px', width: '100%', boxSizing: 'border-box' }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 900, fontStyle: 'italic', color: '#5b9bd5', marginBottom: '4px' }}>
          📚 למידה חכמה
        </h1>
        <p style={{ fontSize: '15px', color: '#6a8a9a', fontWeight: 600 }}>
          העלו חומר לימוד והמורה החכם שלנו יכין לכם תוכנית
        </p>
      </div>

      {/* Progress bar */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '24px' }}>
        {STEP_LABELS.map((label, i) => {
          const idx = i + 1
          const active = step === idx
          const done = step > idx
          return (
            <div key={i} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{
                height: '6px', borderRadius: '3px', marginBottom: '4px',
                background: done ? '#5b9bd5' : active ? '#5b9bd5' : 'rgba(91,155,213,0.2)',
                opacity: active ? 1 : done ? 0.7 : 0.4,
                transition: 'all 0.3s',
              }} />
              <span style={{ fontSize: '10px', color: active ? '#5b9bd5' : '#9ab', fontWeight: active ? 700 : 500 }}>
                {label}
              </span>
            </div>
          )
        })}
      </div>

      {error && (
        <div style={{ ...card, padding: '12px 16px', marginBottom: '16px', background: 'rgba(224,85,85,0.07)', border: '1px solid rgba(224,85,85,0.2)', color: '#e05555', fontSize: '14px', fontWeight: 600, textAlign: 'center' }}>
          {error}
        </div>
      )}

      {/* ── STEP 1: Upload ── */}
      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ ...card, padding: '24px' }}>
            <label style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', display: 'block', marginBottom: '8px' }}>
              נושא
            </label>
            <select
              value={subject}
              onChange={e => setSubject(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1.5px solid rgba(91,155,213,0.25)', fontSize: '15px', background: 'var(--input-bg)', color: 'var(--text)', outline: 'none', fontFamily: 'inherit' }}
            >
              {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* File upload */}
          <div
            style={{ ...card, padding: '28px', textAlign: 'center', cursor: 'pointer', border: '2px dashed rgba(91,155,213,0.35)', background: fileName ? 'rgba(91,155,213,0.05)' : 'white', transition: 'all 0.2s' }}
            onClick={() => fileRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.txt,.docx,image/*"
              style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
            />
            <div style={{ fontSize: '36px', marginBottom: '8px' }}>{fileName ? '✅' : '📎'}</div>
            <p style={{ fontSize: '15px', fontWeight: 700, color: '#5b9bd5', marginBottom: '4px' }}>
              {fileName || 'גררו קובץ לכאן או לחצו להעלאה'}
            </p>
            <p style={{ fontSize: '12px', color: '#9ab' }}>PDF, תמונה, TXT, DOCX</p>
          </div>

          <div style={{ textAlign: 'center', fontSize: '13px', color: '#9ab', fontWeight: 600 }}>— או —</div>

          {/* Paste text */}
          <div style={{ ...card, padding: '20px' }}>
            <label style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', display: 'block', marginBottom: '8px' }}>
              הדביקו טקסט ישירות
            </label>
            <textarea
              value={pastedText}
              onChange={e => setPastedText(e.target.value)}
              placeholder="הדביקו כאן את חומר הלימוד שלכם..."
              rows={6}
              style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid rgba(91,155,213,0.25)', fontSize: '14px', fontFamily: 'inherit', resize: 'vertical', outline: 'none', background: 'var(--input-bg)', color: 'var(--text)', direction: 'rtl', boxSizing: 'border-box' }}
            />
          </div>

          <button
            onClick={startStudy}
            disabled={!material.trim()}
            style={{ width: '100%', padding: '14px', borderRadius: '16px', border: 'none', background: material.trim() ? 'linear-gradient(135deg,#5b9bd5,#4a8ac7)' : '#ccc', color: 'white', fontSize: '17px', fontWeight: 800, cursor: material.trim() ? 'pointer' : 'not-allowed', boxShadow: material.trim() ? '0 4px 14px rgba(91,155,213,0.4)' : 'none', fontFamily: 'inherit' }}
          >
            בואו נתחיל! 🚀
          </button>
        </div>
      )}

      {/* ── STEP 2: Chat ── */}
      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {loading && chatMessages.length < 2 ? (
            <div style={{ ...card, padding: '40px', textAlign: 'center' }}>
              <div className="study-pulse" style={{ fontSize: '48px', marginBottom: '16px' }}>🧠</div>
              <p style={{ fontSize: '16px', fontWeight: 700, color: '#5b9bd5' }}>הבאדי קורא את החומר...</p>
              <p style={{ fontSize: '13px', color: '#9ab', marginTop: '4px' }}>רק רגע אחד</p>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {chatMessages.filter(m => m.role === 'assistant').map((msg, i) => (
                  <div key={i} style={{ ...card, padding: '20px', background: 'rgba(91,155,213,0.05)', borderRight: '4px solid #5b9bd5' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#5b9bd5', marginBottom: '8px' }}>🤖 הבאדי החכם</div>
                    <p style={{ fontSize: '15px', lineHeight: 1.7, color: 'var(--text)', whiteSpace: 'pre-wrap' }}>{msg.content}</p>
                  </div>
                ))}
              </div>

              {!loading && (
                <div style={{ ...card, padding: '16px', display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                  <textarea
                    value={userInput}
                    onChange={e => setUserInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                    placeholder="כתבו את התשובה שלכם..."
                    rows={2}
                    style={{ flex: 1, padding: '10px 12px', borderRadius: '12px', border: '1.5px solid rgba(91,155,213,0.25)', fontSize: '14px', fontFamily: 'inherit', resize: 'none', outline: 'none', background: 'var(--input-bg)', color: 'var(--text)', direction: 'rtl' }}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!userInput.trim()}
                    style={{ padding: '10px 18px', borderRadius: '12px', border: 'none', background: userInput.trim() ? '#5b9bd5' : '#ccc', color: 'white', fontSize: '15px', fontWeight: 700, cursor: userInput.trim() ? 'pointer' : 'not-allowed', fontFamily: 'inherit', flexShrink: 0 }}
                  >
                    שלח ➤
                  </button>
                </div>
              )}

              {loading && (
                <div style={{ textAlign: 'center', padding: '16px' }}>
                  <span className="study-pulse" style={{ fontSize: '24px' }}>⏳</span>
                  <p style={{ fontSize: '13px', color: '#9ab', marginTop: '4px' }}>הבאדי חושב...</p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── STEP 3: Study plan ── */}
      {step === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ ...card, padding: '20px', background: 'linear-gradient(135deg,#5b9bd5,#4a8ac7)', border: 'none' }}>
            <p style={{ fontSize: '16px', fontWeight: 800, color: 'white', marginBottom: '4px' }}>תוכנית הלמידה שלך 🎯</p>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)' }}>עקבו אחרי השלבים בסדר — כל שלב בונה על הקודם</p>
          </div>

          {studyPlan.map((s, i) => (
            <div
              key={i}
              style={{ ...card, padding: '20px', opacity: doneSteps[i] ? 0.65 : 1, transition: 'opacity 0.3s', borderRight: `4px solid ${doneSteps[i] ? '#3aaa6d' : '#5b9bd5'}` }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <button
                  onClick={() => {
                    const next = [...doneSteps]; next[i] = !next[i]; setDoneSteps(next)
                  }}
                  style={{ width: '28px', height: '28px', borderRadius: '8px', border: `2px solid ${doneSteps[i] ? '#3aaa6d' : 'rgba(91,155,213,0.4)'}`, background: doneSteps[i] ? '#3aaa6d' : 'transparent', cursor: 'pointer', fontSize: '14px', color: 'white', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {doneSteps[i] ? '✓' : ''}
                </button>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text)', marginBottom: '6px' }}>
                    שלב {i + 1}: {s.title}
                  </p>
                  <p style={{ fontSize: '14px', lineHeight: 1.65, color: '#4a5a6a', marginBottom: '10px' }}>{s.explanation}</p>
                  <div style={{ background: 'rgba(91,155,213,0.07)', borderRadius: '12px', padding: '12px 14px' }}>
                    <p style={{ fontSize: '12px', fontWeight: 700, color: '#5b9bd5', marginBottom: '4px' }}>✏️ תרגיל</p>
                    <p style={{ fontSize: '13px', color: 'var(--text)', lineHeight: 1.6 }}>{s.exercise}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <button
            onClick={generateQuiz}
            style={{ width: '100%', padding: '14px', borderRadius: '16px', border: 'none', background: 'linear-gradient(135deg,#3aaa6d,#2d9060)', color: 'white', fontSize: '17px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 14px rgba(58,170,109,0.35)', fontFamily: 'inherit' }}
          >
            מוכנים למבחן? 📝
          </button>

          <button
            onClick={resetAll}
            style={{ width: '100%', padding: '10px', borderRadius: '14px', border: '1.5px solid rgba(91,155,213,0.3)', background: 'transparent', color: '#5b9bd5', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            חומר חדש
          </button>
        </div>
      )}

      {/* ── STEP 4: Quiz ── */}
      {step === 4 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {loading ? (
            <div style={{ ...card, padding: '40px', textAlign: 'center' }}>
              <div className="study-pulse" style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
              <p style={{ fontSize: '16px', fontWeight: 700, color: '#5b9bd5' }}>מכין את המבחן...</p>
            </div>
          ) : (
            <>
              {quizSubmitted && (
                <div style={{ ...card, padding: '24px', textAlign: 'center', background: pct >= 80 ? 'rgba(58,170,109,0.07)' : pct >= 60 ? 'rgba(212,150,10,0.07)' : 'rgba(224,85,85,0.07)', borderRight: `4px solid ${pct >= 80 ? '#3aaa6d' : pct >= 60 ? '#d4960a' : '#e05555'}` }}>
                  <p style={{ fontSize: '36px', fontWeight: 900, color: pct >= 80 ? '#3aaa6d' : pct >= 60 ? '#d4960a' : '#e05555', marginBottom: '8px' }}>
                    {score}/{quizQuestions.length}
                  </p>
                  <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)' }}>
                    {pct >= 80 ? 'מדהים! שלטתם בחומר! 🌟' : pct >= 60 ? 'כל הכבוד! כמעט שם. חזרו על מה שפספסתם 💪' : 'לא נורא! חזרו על תוכנית הלמידה ונסו שוב. אתם יכולים! 🤗'}
                  </p>
                </div>
              )}

              {quizQuestions.map((q, qi) => {
                const answered = selectedAnswers[qi]
                const correct = q.correctAnswer
                const isCorrect = answered === correct
                return (
                  <div key={qi} style={{ ...card, padding: '20px' }}>
                    <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)', marginBottom: '14px', lineHeight: 1.5 }}>
                      {qi + 1}. {q.question}
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {q.options.map((opt, oi) => {
                        let bg = 'rgba(91,155,213,0.06)'
                        let border = '1.5px solid rgba(91,155,213,0.2)'
                        let color = '#2a3a4a'
                        if (!quizSubmitted && answered === oi) { bg = 'rgba(91,155,213,0.15)'; border = '1.5px solid #5b9bd5'; color = '#5b9bd5' }
                        if (quizSubmitted && oi === correct) { bg = 'rgba(58,170,109,0.12)'; border = '1.5px solid #3aaa6d'; color = '#2a7a50' }
                        if (quizSubmitted && answered === oi && !isCorrect) { bg = 'rgba(224,85,85,0.1)'; border = '1.5px solid #e05555'; color = '#e05555' }
                        return (
                          <button
                            key={oi}
                            disabled={quizSubmitted}
                            onClick={() => {
                              if (quizSubmitted) return
                              const next = [...selectedAnswers]; next[qi] = oi; setSelectedAnswers(next)
                            }}
                            style={{ width: '100%', textAlign: 'right', padding: '11px 14px', borderRadius: '12px', border, background: bg, color, fontSize: '14px', fontWeight: 600, cursor: quizSubmitted ? 'default' : 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}
                          >
                            {quizSubmitted && oi === correct && '✅ '}
                            {quizSubmitted && answered === oi && !isCorrect && '❌ '}
                            {opt}
                          </button>
                        )
                      })}
                    </div>
                    {quizSubmitted && !isCorrect && (
                      <div style={{ marginTop: '10px', padding: '10px 14px', borderRadius: '12px', background: 'rgba(91,155,213,0.07)', fontSize: '13px', color: '#4a6a8a', lineHeight: 1.6 }}>
                        💡 {q.explanation}
                      </div>
                    )}
                  </div>
                )
              })}

              {error && (
                <p style={{ textAlign: 'center', color: '#e05555', fontSize: '14px', fontWeight: 600 }}>{error}</p>
              )}

              {!quizSubmitted ? (
                <button
                  onClick={submitQuiz}
                  style={{ width: '100%', padding: '14px', borderRadius: '16px', border: 'none', background: 'linear-gradient(135deg,#5b9bd5,#4a8ac7)', color: 'white', fontSize: '17px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 14px rgba(91,155,213,0.4)', fontFamily: 'inherit' }}
                >
                  הגשת מבחן ✅
                </button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button
                    onClick={generateQuiz}
                    style={{ width: '100%', padding: '13px', borderRadius: '16px', border: 'none', background: 'linear-gradient(135deg,#5b9bd5,#4a8ac7)', color: 'white', fontSize: '15px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    מבחן חדש 🔄
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    style={{ width: '100%', padding: '12px', borderRadius: '14px', border: '1.5px solid rgba(91,155,213,0.3)', background: 'transparent', color: '#5b9bd5', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    חזרה לתוכנית הלמידה
                  </button>
                  <button
                    onClick={resetAll}
                    style={{ width: '100%', padding: '10px', borderRadius: '14px', border: '1.5px solid rgba(91,155,213,0.2)', background: 'transparent', color: '#9ab', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    חומר חדש
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
