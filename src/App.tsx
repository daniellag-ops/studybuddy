import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import BackgroundCircles from './components/BackgroundCircles'
import Chatbot from './components/Chatbot'
import Dashboard from './pages/Dashboard'
import Tasks from './pages/Tasks'
import Schedule from './pages/Schedule'
import Tips from './pages/Tips'

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ position: 'relative', minHeight: '100vh', overflowX: 'hidden' }}>
        <BackgroundCircles />
        <div style={{ position: 'relative', zIndex: 10 }}>
          <Navbar />
          <main style={{ paddingBottom: '80px', width: '100%' }}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/schedule" element={<Schedule />} />
              <Route path="/tips" element={<Tips />} />
            </Routes>
          </main>
        </div>
        <Chatbot />
      </div>
    </BrowserRouter>
  )
}
