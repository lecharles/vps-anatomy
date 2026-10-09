import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import Home from './pages/Home'
import Lessons from './pages/Lessons'
import Modules from './pages/Modules'
import ModuleDetail from './pages/ModuleDetail'
import Architecture from './pages/Architecture'
import SignalFlow from './pages/SignalFlow'
import DataFlow from './pages/DataFlow'
import Changes from './pages/Changes'

function App() {
  return (
    <BrowserRouter>
      <header>
        <div className="container">
          <h1>VPS Anatomy</h1>
          <p className="subtitle">The Architecture of a Live AI-Agent Machine</p>
          <p className="meta">An educational reader for computer science — Stanford CS grade · Live monitoring</p>
        </div>
      </header>

      <nav>
        <div className="container">
          <NavLink to="/" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'} end>Home</NavLink>
          <NavLink to="/lessons" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>Lessons</NavLink>
          <NavLink to="/modules" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>Modules</NavLink>
          <NavLink to="/architecture" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>Architecture</NavLink>
          <NavLink to="/signal-flow" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>Signal Flow</NavLink>
          <NavLink to="/data-flow" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>Data Flow</NavLink>
          <NavLink to="/changes" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>Changes</NavLink>
        </div>
      </nav>

      <main className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/lessons" element={<Lessons />} />
          <Route path="/modules" element={<Modules />} />
          <Route path="/modules/:moduleId" element={<ModuleDetail />} />
          <Route path="/architecture" element={<Architecture />} />
          <Route path="/signal-flow" element={<SignalFlow />} />
          <Route path="/data-flow" element={<DataFlow />} />
          <Route path="/changes" element={<Changes />} />
        </Routes>
      </main>

      <footer>
        <div className="container">
          <p>Built by Hermes (Rook) for Carlos (lecharles) on a live AI-agent VPS.</p>
          <p>Live monitoring: the app scans the VPS every 30 seconds and updates itself autonomously.</p>
          <p><a href="https://github.com/lecharles/vps-anatomy">GitHub</a> · MIT License · React + TypeScript + FastAPI</p>
        </div>
      </footer>
    </BrowserRouter>
  )
}

export default App
