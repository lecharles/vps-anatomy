import Home from './pages/Home'
import Lessons from './pages/Lessons'
import Modules from './pages/Modules'
import ModuleDetail from './pages/ModuleDetail'
import Architecture from './pages/Architecture'
import SignalFlow from './pages/SignalFlow'
import DataFlow from './pages/DataFlow'
import Changes from './pages/Changes'
import Guide from './pages/Guide'
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import ThemeToggle from './components/ThemeToggle'

function Shell({ children }: { children: React.ReactNode }) {
  // S17c — reader semantics: real landmarks instead of decorative divs.
  // header / nav[name] / main / footer now speak to a screen reader's
  // landmark list; the skip link is the first tab stop on every page,
  // invisible until a keyboard user lands on it.
  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className="topbar">
        <div className="topbar-inner">
          <NavLink to="/" className="brand">
            <span className="mark" /> VPS Anatomy
          </NavLink>
          <nav className="main-nav" aria-label="Primary">
            {([
              ['/', 'Home', true],
              ['/lessons', 'Lessons', false],
              ['/modules', 'Modules', false],
              ['/architecture', 'Architecture', false],
              ['/signal-flow', 'Signal Flow', false],
              ['/data-flow', 'Data Flow', false],
              ['/changes', 'Changes', false],
              ['/guide', 'Guide', false],
            ] as [string, string, boolean][]).map(([to, label, end]) => (
              <NavLink key={to} to={to} end={end}
                className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                {label}
              </NavLink>
            ))}
            <a className="nav-link" href="/docs" target="_blank" rel="noreferrer">API ↗</a>
          </nav>
          <ThemeToggle />
        </div>
      </header>
      <main className="content wrap" id="main-content" tabIndex={-1}>{children}</main>
      <footer className="site">
        <div className="wrap">
          <p className="f-line">VPS Anatomy · an educational reader for a live AI-agent machine.</p>
          <p className="f-line">
            Self-scanning every 30s · <a href="/docs">API reference</a> ·{' '}
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
          <Route path="/guide" element={<Guide />} />
        </Routes>
      </Shell>
    </BrowserRouter>
  )
}

export default App
