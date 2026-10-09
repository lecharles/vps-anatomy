import Home from './pages/Home'
import Lessons from './pages/Lessons'
import Modules from './pages/Modules'
import ModuleDetail from './pages/ModuleDetail'
import Architecture from './pages/Architecture'
import SignalFlow from './pages/SignalFlow'
import DataFlow from './pages/DataFlow'
import Changes from './pages/Changes'
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import ThemeToggle from './components/ThemeToggle'

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="topbar">
        <div className="topbar-inner">
          <NavLink to="/" className="brand">
            <span className="mark" /> VPS Anatomy <small>· thehost</small>
          </NavLink>
          <nav className="main-nav">
            {([
              ['/', 'Home', true],
              ['/lessons', 'Lessons', false],
              ['/modules', 'Modules', false],
              ['/architecture', 'Architecture', false],
              ['/signal-flow', 'Signal Flow', false],
              ['/data-flow', 'Data Flow', false],
              ['/changes', 'Changes', false],
            ] as [string, string, boolean][]).map(([to, label, end]) => (
              <NavLink key={to} to={to} end={end}
                className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                {label}
              </NavLink>
            ))}
          </nav>
          <ThemeToggle />
        </div>
      </div>
      <main className="content wrap">{children}</main>
      <footer className="site">
        <div className="wrap">
          <p className="f-line">VPS Anatomy · an educational reader for a live AI-agent machine.</p>
          <p className="f-line">
            Built by <span className="muted">Hermes</span> for <span className="muted">Carlos</span> · self-scanning every 30s ·{' '}
            <a href="https://github.com/lecharles/vps-anatomy">GitHub</a> · MIT · React + TypeScript + FastAPI
          </p>
        </div>
      </footer>
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Shell>
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
      </Shell>
    </BrowserRouter>
  )
}

export default App
