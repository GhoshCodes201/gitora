import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  BarChart3,
  Flame,
  FolderGit2,
  GitPullRequest,
  Globe,
  ShieldCheck,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { cleanUsername } from '../utils/format'

const PILLARS = [
  {
    icon: BarChart3,
    title: 'Activity',
    desc: 'Commits, repositories, stars and issues rolled into a single signal.',
  },
  {
    icon: Flame,
    title: 'Consistency',
    desc: 'Active weeks, contribution streaks and your coding rhythm over time.',
  },
  {
    icon: GitPullRequest,
    title: 'Collaboration',
    desc: 'Issues, forks and community engagement. Partial without a token.',
  },
  {
    icon: FolderGit2,
    title: 'Project Quality',
    desc: 'Documentation, licensing, community interest and maintenance recency.',
  },
  {
    icon: Globe,
    title: 'Open Source',
    desc: 'Public projects and contributions to the broader ecosystem.',
  },
]

const FORMULA = [
  { name: 'Activity', weight: '× 0.20' },
  { name: 'Consistency', weight: '× 0.25' },
  { name: 'Collaboration', weight: '× 0.20' },
  { name: 'Project Quality', weight: '× 0.20' },
  { name: 'Open Source', weight: '× 0.15' },
]

export default function Landing() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const cleaned = cleanUsername(username)
    if (cleaned) navigate(`/analyze?u=${encodeURIComponent(cleaned)}`)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-accent/20 blur-3xl" />
          <div className="mx-auto max-w-4xl px-4 pb-20 pt-24 text-center">
            <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl">
              Gitora
            </h1>
            <p className="mt-3 bg-gradient-to-r from-accent to-cyan bg-clip-text text-2xl font-bold text-transparent sm:text-3xl">
              Your Code. Your Aura.
            </p>
            <p className="mx-auto mt-6 max-w-xl text-lg text-muted">
              Turn your GitHub activity into developer intelligence — activity, consistency, project
              quality and open-source signal, distilled into one score.
            </p>

            <form onSubmit={handleSubmit} className="mx-auto mt-10 flex max-w-md items-center gap-2">
              <div className="relative flex-1">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted">@</span>
                <input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="username"
                  className="w-full rounded-xl border border-border bg-surface py-3 pl-9 pr-4 text-ink outline-none transition placeholder:text-muted focus:border-accent"
                  aria-label="GitHub username"
                />
              </div>
              <button
                type="submit"
                className="flex items-center gap-2 rounded-xl bg-accent px-5 py-3 font-medium text-white transition hover:bg-accent2"
              >
                Analyze <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <p className="mt-4 text-xs text-muted">
              No sign-up. Public GitHub data only.{' '}
              <Link to="/analyze" className="text-accent2 underline-offset-2 hover:underline">
                or open the analyzer
              </Link>
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-center text-2xl font-bold">What Gitora analyzes</h2>
          <p className="mt-2 text-center text-muted">
            Five weighted pillars feed into your Gitora Score.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {PILLARS.map((pillar) => (
              <div key={pillar.title} className="rounded-2xl border border-border bg-surface p-5">
                <pillar.icon className="h-6 w-6 text-accent" />
                <h3 className="mt-3 font-semibold">{pillar.title}</h3>
                <p className="mt-1 text-sm text-muted">{pillar.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-y border-border bg-surface py-16">
          <div className="mx-auto max-w-4xl px-4 text-center">
            <h2 className="text-2xl font-bold">How the score works</h2>
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {FORMULA.map((item) => (
                <div key={item.name} className="rounded-xl border border-border bg-bg p-4">
                  <div className="text-sm text-ink">{item.name}</div>
                  <div className="mt-1 font-mono text-accent2">{item.weight}</div>
                </div>
              ))}
            </div>
            <p className="mx-auto mt-6 flex max-w-xl items-start gap-2 text-left text-xs text-muted">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              Gitora Score is a custom metric created by Gitora based on public GitHub data. It is
              not affiliated with or endorsed by GitHub, and is a rough estimate, not an official
              rating.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-4 py-20 text-center">
          <h2 className="text-3xl font-bold">Ready to see your aura?</h2>
          <p className="mt-3 text-muted">Enter your GitHub username and get your developer profile in seconds.</p>
          <Link
            to="/analyze"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 font-medium text-white transition hover:bg-accent2"
          >
            Analyze My GitHub <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </main>

      <Footer />
    </div>
  )
}
