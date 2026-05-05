import { useState, useRef, useEffect } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import type { Task, ScheduleData } from '../types'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const INITIAL_MESSAGE: Message = {
  role: 'assistant',
  content: 'היי! 👋 אני הבאדי שלכם. שאלו אותי כל שאלה!',
}

interface Props {
  open: boolean
  setOpen: (v: boolean | ((prev: boolean) => boolean)) => void
}

export default function Chatbot({ open, setOpen }: Props) {
  const [messages, setMessages] = useLocalStorage<Message[]>('sb_chat', [INITIAL_MESSAGE])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const [tasks] = useLocalStorage<Task[]>('sb_tasks', [])
  const [schedule] = useLocalStorage<ScheduleData>('sb_schedule', {})
  const [stress] = useLocalStorage<number>('sb_stress', 1)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const buildSystemPrompt = () => {
    const openTasks = tasks.filter(t => !t.done).length
    const todayIdx = new Date().getDay()
    const todayEvents = (schedule[todayIdx] || []).map(e => `${e.time} - ${e.activity}`).join(', ') || 'אין'
    const stressLabel = ['', 'רגוע', 'בסדר', 'לחוץ קצת', 'לחוץ', 'על הקצה'][stress]
    return `אתה "באדי" — עוזר חכם וחברותי לתלמידי כיתה ח׳. ענה תמיד בעברית, בטון צעיר. תן עצות קצרות (2-4 משפטים).
מידע על התלמיד: ${openTasks} משימות פתוחות, אירועי היום: ${todayEvents}, רמת לחץ: ${stressLabel}.`
  }

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    const userMsg: Message = { role: 'user', content: input.trim() }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setInput('')
    setLoading(true)
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY || '',
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: buildSystemPrompt(),
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      })
      const data = await response.json()
      const assistantContent = data.content?.[0]?.text || 'מצטערים, משהו השתבש. נסו שוב.'
      setMessages(prev => [...prev, { role: 'assistant', content: assistantContent }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'אופס! לא הצלחתי להתחבר. בדקו את החיבור לאינטרנט.' }])
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed left-4 z-50 flex flex-col rounded-[24px] overflow-hidden"
      style={{
        bottom: '82px',
        width: '360px',
        height: '500px',
        background: 'white',
        border: '1.5px solid rgba(91,155,213,0.18)',
        boxShadow: '0 12px 48px rgba(91,155,213,0.22)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3"
        style={{ background: 'linear-gradient(135deg, #5b9bd5, #4a8ac7)' }}
      >
        <span className="text-2xl">🤖</span>
        <div style={{ flex: 1 }}>
          <div className="text-white font-bold text-sm">באדי — העוזר החכם שלכם</div>
          <div className="text-xs" style={{ color: 'rgba(255,255,255,0.75)' }}>תמיד כאן לעזור</div>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="text-white text-lg font-bold opacity-70 hover:opacity-100 transition-opacity"
          style={{ background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1 }}
        >
          ✕
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}>
            <div
              className="max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed"
              style={
                msg.role === 'user'
                  ? { background: 'rgba(91,155,213,0.12)', color: '#2a3a4a' }
                  : { background: 'white', color: '#2a3a4a', border: '1px solid rgba(91,155,213,0.15)', boxShadow: '0 1px 6px rgba(91,155,213,0.1)' }
              }
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-end">
            <div
              className="px-4 py-3 rounded-2xl flex gap-1.5"
              style={{ background: 'white', border: '1px solid rgba(91,155,213,0.15)' }}
            >
              <span className="typing-dot w-2 h-2 rounded-full inline-block" style={{ background: '#5b9bd5' }} />
              <span className="typing-dot w-2 h-2 rounded-full inline-block" style={{ background: '#5b9bd5' }} />
              <span className="typing-dot w-2 h-2 rounded-full inline-block" style={{ background: '#5b9bd5' }} />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        className="flex gap-2 p-3"
        style={{ borderTop: '1px solid rgba(91,155,213,0.12)' }}
      >
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="כתבו הודעה..."
          className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
          style={{ border: '1.5px solid rgba(91,155,213,0.25)', background: '#f0f6fd', color: '#2a3a4a' }}
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          className="px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #5b9bd5, #4a8ac7)', border: 'none', cursor: 'pointer' }}
        >
          שלח
        </button>
      </div>
    </div>
  )
}
