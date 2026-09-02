import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import ScrollToTop from './components/ScrollToTop'
import ErrorBoundary from './components/ErrorBoundary'
import { AuthProvider } from './hooks/useAuth'

const Landing = lazy(() => import('./pages/Landing'))
const Analyze = lazy(() => import('./pages/Analyze'))
const Dashboard = lazy(() => import('./pages/Dashboard'))

function Loader() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg">
      <div className="flex h-14 w-14 animate-pulse-glow items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-pink text-2xl font-bold text-white">
        G
      </div>
      <p className="font-mono text-xs text-muted">summoning aura…</p>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <MotionConfig reducedMotion="user">
        <ErrorBoundary>
          <AuthProvider>
            <ScrollToTop />
            <Suspense fallback={<Loader />}>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/analyze" element={<Analyze />} />
                <Route path="/dashboard/:username" element={<Dashboard />} />
                <Route path="*" element={<Landing />} />
              </Routes>
            </Suspense>
          </AuthProvider>
        </ErrorBoundary>
      </MotionConfig>
    </BrowserRouter>
  )
}
