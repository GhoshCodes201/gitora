import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  BarChart3,
  Flame,
  FolderGit2,
  GitPullRequest,
  Globe,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import DemoGauge from '../components/DemoGauge'
import { cleanUsername } from '../utils/format'
import { RANKS } from '../utils/ranks'
import { usePageTitle } from '../hooks/usePageTitle'

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
  { name: 'Activity', weight: 0.2 },
  { name: 'Consistency', weight: 0.25 },
  { name: 'Collaboration', weight: 0.2 },
  { name: 'Project Quality', weight: 0.2 },
  { name: 'Open Source', weight: 0.15 },
]

const PARTICLES = [
  { left: '8%', top: '22%', size: 5, delay: '0s', duration: '9s' },
  { left: '16%', top: '68%', size: 4, delay: '1.4s', duration: '11s' },
  { left: '28%', top: '36%', size: 6, delay: '0.7s', duration: '8s' },
  { left: '44%', top: '76%', size: 4, delay: '2s', duration: '12s' },
  { left: '62%', top: '18%', size: 5, delay: '0.3s', duration: '10s' },
  { left: '78%', top: '60%', size: 4, delay: '1.1s', duration: '9s' },
  { left: '88%', top: '30%', size: 6, delay: '0s', duration: '11s' },
  { left: '94%', top: '72%', size: 5, delay: '1.8s', duration: '8.5s' },
]

function SectionHeading({ eyebrow, title, sub }: { eyebrow: string; title: string; sub: string }) {
  return (
    <motion.div
      className="text-center"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-accent2">{eyebrow}</span>
      <h2 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
      <p className="mt-3 text-muted">{sub}</p>
    </motion.div>
  )
}

export default function Landing() {
  usePageTitle('Gitora — Your Code. Your Aura.')
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
          <div className="pointer-events-none absolute -top-32 left-1/2 h-[28rem] w-[46rem] -translate-x-1/2 rounded-full bg-accent/25 blur-3xl" />
          <div className="pointer-events-none absolute -left-24 top-44 h-72 w-72 rounded-full bg-cyan/15 blur-3xl" />
          <div className="pointer-events-none absolute -right-24 bottom-4 h-72 w-72 rounded-full bg-accent2/15 blur-3xl" />
          <div
            className="pointer-events-none absolute inset-0 [background-image:linear-gradient(rgba(139,92,246,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.07)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black_35%,transparent_100%)]"
          />
          {PARTICLES.map((particle, index) => (
            <span
              key={index}
              className="pointer-events-none absolute rounded-full bg-accent/50"
              style={{
                left: particle.left,
                top: particle.top,
                width: particle.size,
                height: particle.size,
                boxShadow: '0 0 10px rgba(139,92,246,0.7)',
                animation: `float ${particle.duration} ease-in-out infinite`,
                animationDelay: particle.delay,
              }}
            />
          ))}

          <div className="relative mx-auto grid max-w-6xl gap-14 px-4 pb-20 pt-16 lg:grid-cols-2 lg:items-center lg:pt-24">
            <div>
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <span className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-medium text-accent2">
                  <Sparkles className="h-3.5 w-3.5" /> Developer intelligence from your GitHub
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="mt-5 font-display text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl"
              >
                Your code has an{' '}
                <span className="bg-gradient-to-r from-accent via-accent2 to-cyan bg-clip-text text-transparent [text-shadow:0_0_34px_rgba(139,92,246,0.5)]">
                  aura
                </span>
                .
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="mt-5 max-w-lg text-lg text-muted"
              >
                Turn your GitHub activity into a developer score — activity, consistency, project
                quality and open-source signal, distilled into one number.
              </motion.p>

              <motion.form
                onSubmit={handleSubmit}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="mt-9 flex max-w-md items-center gap-2"
              >
                <div className="relative flex-1">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted">@</span>
                  <input
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    placeholder="username"
                    className="w-full rounded-xl border border-border bg-surface py-3 pl-9 pr-4 text-ink outline-none transition placeholder:text-muted focus:border-accent focus:shadow-[0_0_0_3px_rgba(139,92,246,0.15)]"
                    aria-label="GitHub username"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!cleanUsername(username)}
                  className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-accent to-accent2 px-5 py-3 font-medium text-white transition hover:shadow-[0_8px_30px_-8px_rgba(139,92,246,0.7)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Analyze
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </button>
              </motion.form>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.45 }}
                className="mt-4 text-xs text-muted"
              >
                No sign-up. Public GitHub data only.{' '}
                <Link to="/analyze" className="text-accent2 underline-offset-2 hover:underline">
                  or open the analyzer
                </Link>
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.25 }}
              className="mx-auto w-fit"
            >
              <div className="card p-6">
                <span className="mb-4 flex items-center justify-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.25em] text-cyan">
                  <span className="h-1.5 w-1.5 animate-pulse-glow rounded-full bg-cyan" /> live preview
                </span>
                <DemoGauge username={username} />
              </div>
            </motion.div>
          </div>
        </section>

        <section className="border-y border-border bg-surface/40 py-8">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-2.5 px-4">
            {RANKS.map((tier) => (
              <div
                key={tier.name}
                className="flex items-center gap-2 rounded-full border border-border bg-bg px-3 py-1.5 transition hover:-translate-y-0.5"
                style={{ boxShadow: `0 0 18px -8px ${tier.glow}` }}
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: tier.color, boxShadow: `0 0 8px ${tier.color}` }}
                />
                <span className="text-xs font-semibold text-ink">{tier.name}</span>
                <span className="font-mono text-[10px] text-muted">+{tier.min}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-20">
          <SectionHeading
            eyebrow="The five pillars"
            title="What Gitora analyzes"
            sub="Five weighted signals feed into your Gitora Score."
          />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {PILLARS.map((pillar, index) => (
              <motion.div
                key={pillar.title}
                className="card card-hover p-5"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.07 }}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-accent/25 to-cyan/20 text-accent2">
                  <pillar.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold text-ink">{pillar.title}</h3>
                <p className="mt-1.5 text-sm text-muted">{pillar.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="border-y border-border bg-surface/40 py-20">
          <div className="mx-auto max-w-3xl px-4 text-center">
            <SectionHeading
              eyebrow="The score machine"
              title="How your score is composed"
              sub="Weighted pillars in, one aura out."
            />
            <div className="mt-10 space-y-4 text-left">
              {FORMULA.map((item, index) => {
                const barPct = item.weight * 100
                return (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: -18 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.45, delay: index * 0.08 }}
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-ink">{item.name}</span>
                      <span className="font-mono text-accent2">× {item.weight.toFixed(2)}</span>
                    </div>
                    <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-bg">
                      <motion.div
                        className="h-full rounded-full"
                        style={{
                          background: `linear-gradient(90deg, ${RANKS[index].color}66, ${RANKS[index].color})`,
                        }}
                        initial={{ width: 0 }}
                        whileInView={{ width: `${barPct}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
                      />
                    </div>
                  </motion.div>
                )
              })}

              <motion.div
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex items-center justify-between rounded-2xl border border-accent/40 bg-accent/10 px-5 py-4"
              >
                <span className="font-display text-lg font-bold text-ink">Your Gitora Score</span>
                <span className="font-mono text-lg font-semibold text-accent2">= your aura</span>
              </motion.div>
            </div>

            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mx-auto mt-8 flex max-w-xl items-start gap-2 text-left text-xs text-muted"
            >
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              Gitora Score is a custom metric created by Gitora based on public GitHub data. It is
              not affiliated with or endorsed by GitHub, and is a rough estimate, not an official
              rating.
            </motion.p>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-4 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-surface to-surface2 p-10 text-center"
          >
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-accent/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-cyan/15 blur-3xl" />
            <div className="relative">
              <h2 className="font-display text-3xl font-bold tracking-tight">Ready to see your aura?</h2>
              <p className="mx-auto mt-3 max-w-md text-muted">
                Enter your GitHub username and get your developer profile in seconds.
              </p>
              <Link
                to="/analyze"
                className="group mt-8 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-accent to-accent2 px-6 py-3 font-medium text-white transition hover:shadow-[0_8px_30px_-8px_rgba(139,92,246,0.7)]"
              >
                Analyze My GitHub
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </motion.div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
