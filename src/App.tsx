import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import BottomNav from './components/Navbar'
import BackgroundCircles from './components/BackgroundCircles'
import Chatbot from './components/Chatbot'
import Dashboard from './pages/Dashboard'
import Tasks from './pages/Tasks'
import Schedule from './pages/Schedule'
import Tips from './pages/Tips'

export default function App() {
  const [chatOpen, setChatOpen] = useState(false)

  return (
    <BrowserRouter>
      <div style={{ position: 'relative', minHeight: '100vh', overflowX: 'hidden' }}>
        <BackgroundCircles />
        <div style={{ position: 'relative', zIndex: 10 }}>
          <main style={{ paddingBottom: '88px', width: '100%' }}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/schedule" element={<Schedule />} />
              <Route path="/tips" element={<Tips />} />
            </Routes>
          </main>
        </div>
        <Chatbot open={chatOpen} setOpen={setChatOpen} />
        <BottomNav chatOpen={chatOpen} onChatToggle={() => setChatOpen(o => !o)} />
      </div>
    </BrowserRouter>
  )
}
