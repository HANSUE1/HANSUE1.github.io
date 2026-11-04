import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react"
import history from "@/data/build-history.json"

// The Build chapter's chart: every public repo as one bar of lines of code, split by language. It replays the real
// git history a week at a time when the chapter opens, and the commit timeline underneath rewinds it. The numbers come
// from tools/build-history.py, which is also how to refresh them. Styling: css/components/about-chapters.css.

type Project = { name: string; url: string; lines: Record<string, number[]>; commits: number[] }

const projects = history.projects as unknown as Project[]
const { weeks, measured } = history
const LAST = weeks.length - 1
const STEP_MS = 340

/** A language keeps its slot whatever else is on screen. This order passes the palette validator on the panel's ink. */
const LANGUAGES = ["JavaScript", "Python", "HTML", "TypeScript", "CSS", "Java", "C++", "SQL"]
const COLORS = ["#3987e5", "#d95926", "#199e70", "#c98500", "#d55181", "#008300", "#9085e9", "#e66767"]
const shown = LANGUAGES.filter((language) => projects.some((project) => project.lines[language]))
const color = (language: string) => COLORS[LANGUAGES.indexOf(language)]

const linesAt = (project: Project, week: number) => Object.values(project.lines).reduce((sum, series) => sum + series[week], 0)
const commitsTo = (project: Project, week: number) => project.commits.slice(0, week + 1).reduce((sum, count) => sum + count, 0)
const sumOf = (read: (project: Project) => number) => projects.reduce((sum, project) => sum + read(project), 0)
const weekCommits = weeks.map((_, week) => sumOf((project) => project.commits[week]))
const longest = Math.max(...projects.flatMap((project) => weeks.map((_, week) => linesAt(project, week))))
const busiest = Math.max(...weekCommits)

const number = (value: number) => value.toLocaleString("en-US")
const plural = (count: number, word: string) => `${number(count)} ${word}${count === 1 ? "" : "s"}`
const day = (date: string, options: Intl.DateTimeFormatOptions) => new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", { timeZone: "UTC", ...options })
const shortDay = (date: string) => day(date, { month: "short", day: "numeric" })
const month = (date: string) => day(date, { month: "short" })

function Tip({ project, week, spot }: { project: Project; week: number; spot: { x: number; y: number } }) {
  const parts = shown.filter((language) => project.lines[language]?.[week])
  return (
    <div className="build-tip" style={{ transform: `translate(${spot.x}px,${spot.y}px)` }} aria-hidden="true">
      <p>{project.name}</p>
      {parts.map((language) => (
        <p className="build-tip-row" key={language}>
          <i style={{ background: color(language) }} />
          <strong>{number(project.lines[language][week])}</strong> {language}
        </p>
      ))}
      {!parts.length && <p className="build-tip-row">Not started yet</p>}
      <p className="build-tip-foot">{plural(commitsTo(project, week), "commit")} so far</p>
    </div>
  )
}

export default function BuildChart({ running }: { running: boolean }) {
  const [week, setWeek] = useState(0)
  const [language, setLanguage] = useState<string | null>(null)
  const [hovered, setHovered] = useState<number | null>(null)
  const [spot, setSpot] = useState({ x: 0, y: 0 })
  const chart = useRef<HTMLElement>(null)
  const timer = useRef(0)
  const at = useRef(0)
  at.current = week

  const stop = useCallback(() => window.clearTimeout(timer.current), [])
  // Builds forward from a week to today. Also how the chart recovers after being rewound.
  const play = useCallback((from: number, wait = STEP_MS) => {
    window.clearTimeout(timer.current)
    const step = (next: number) => {
      setWeek(next)
      if (next < LAST) timer.current = window.setTimeout(() => step(next + 1), STEP_MS)
    }
    timer.current = window.setTimeout(() => step(from), wait)
  }, [])

  useEffect(() => {
    if (!running) return
    play(0, 650) // waits for the chapter's fade
    return () => {
      stop()
      setWeek(0)
      setHovered(null)
    }
  }, [running, play, stop])

  const scrub = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse" && !event.buttons) return
    const rect = event.currentTarget.getBoundingClientRect()
    stop()
    setWeek(Math.max(0, Math.min(LAST, Math.floor(((event.clientX - rect.left) / rect.width) * weeks.length))))
  }
  const resume = () => {
    if (at.current < LAST) play(at.current + 1)
  }
  const onTimeKey = (event: KeyboardEvent) => {
    const next = { ArrowLeft: week - 1, ArrowDown: week - 1, ArrowRight: week + 1, ArrowUp: week + 1, Home: 0, End: LAST }[event.key]
    if (next === undefined) return
    event.preventDefault()
    stop()
    setWeek(Math.max(0, Math.min(LAST, next)))
  }

  // Beside the pointer, or beside the row for keyboard focus, and always inside the panel.
  const place = (clientX: number, clientY: number) => {
    const box = chart.current!.getBoundingClientRect()
    setSpot({ x: Math.min(clientX - box.left + 14, box.width - 190), y: Math.max(8, Math.min(clientY - box.top - 30, box.height - 170)) })
  }

  const lines = sumOf((project) => linesAt(project, week))
  const commits = sumOf((project) => commitsTo(project, week))
  const started = projects.filter((project) => linesAt(project, week) > 0).length
  const source = `Measured from git history on ${day(measured, { month: "short", day: "numeric", year: "numeric" })}. Lockfiles, build output and generated files aren't counted. e-Barangay was uploaded in one commit, so it lands in a single week.`

  return (
    <figure className="build-chart" ref={chart} data-focus={language ?? undefined} aria-label={`Lines of code across ${projects.length} public repositories, by language`}>
      <div className="build-summary">
        <p className="build-figure">{number(lines)}</p>
        <p className="build-figure-label">lines by the week of {shortDay(weeks[week])}</p>
        <p className="build-figure-sub">{plural(commits, "commit")}, {plural(started, "public repo")}</p>
        <button className="build-replay" type="button" aria-label="Replay" onClick={() => play(0, 0)}>
          <svg className="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.6-5.9M4 4v4.5h4.5" /></svg>
          <span>Replay</span>
        </button>
      </div>

      <ul className="build-legend" aria-label="Languages">
        {shown.map((name) => (
          <li key={name}>
            <button
              type="button" aria-pressed={language === name} onPointerEnter={(event) => event.pointerType === "mouse" && setLanguage(name)} onPointerLeave={() => setLanguage(null)}
              onFocus={() => setLanguage(name)} onBlur={() => setLanguage(null)}
            >
              <i style={{ background: color(name) }} />{name}
            </button>
          </li>
        ))}
      </ul>

      <div className="build-rows">
        {projects.map((project, i) => {
          const total = linesAt(project, week)
          return (
            <a
              className="build-row" key={project.name} href={project.url} target="_blank" rel="noopener noreferrer" data-idle={total === 0 || undefined} data-dim={(hovered !== null && hovered !== i) || undefined}
              aria-label={`${project.name}: ${plural(total, "line")}. Opens on GitHub`}
              onPointerEnter={(event) => { if (event.pointerType === "mouse") { setHovered(i); place(event.clientX, event.clientY) } }}
              onPointerMove={(event) => { if (event.pointerType === "mouse") place(event.clientX, event.clientY) }}
              onPointerLeave={() => setHovered(null)}
              onFocus={(event) => { const rect = event.currentTarget.getBoundingClientRect(); setHovered(i); place(rect.left + rect.width * 0.4, rect.top) }}
              onBlur={() => setHovered(null)}
            >
              <span className="build-name">{project.name}</span>
              <span className="build-track" aria-hidden="true">
                <span className="build-bar" style={{ width: `${(total / longest) * 100}%` }}>
                  {shown.filter((name) => project.lines[name]).map((name) => {
                    const part = project.lines[name][week]
                    return <span key={name} data-lang={name} data-empty={!part || undefined} style={{ width: total ? `${(part / total) * 100}%` : 0, background: color(name), opacity: language && language !== name ? 0.16 : 1 }} />
                  })}
                </span>
              </span>
              <span className="build-value" aria-hidden="true">{number(total)}</span>
            </a>
          )
        })}
      </div>

      <div
        className="build-time" role="slider" tabIndex={0} aria-label="Week shown" aria-valuemin={0} aria-valuemax={LAST} aria-valuenow={week}
        aria-valuetext={`Week of ${shortDay(weeks[week])}: ${plural(lines, "line")}, ${plural(weekCommits[week], "commit")} that week`}
        onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); scrub(event) }} onPointerMove={scrub} onPointerUp={resume} onPointerLeave={resume} onKeyDown={onTimeKey}
      >
        <p className="build-time-label"><span>Commits per week.</span> Slide along to rewind.</p>
        <div className="build-weeks" aria-hidden="true">
          {weeks.map((date, i) => {
            const fresh = i === 0 || month(date) !== month(weeks[i - 1])
            return (
              <div className="build-week" key={date} data-past={i <= week || undefined} data-now={i === week || undefined}>
                <span className="build-week-bar" style={{ height: `${(weekCommits[i] / busiest) * 100}%` }}>
                  <span className="build-week-count">{weekCommits[i]}</span>
                </span>
                <span className="build-week-month">{fresh ? month(date) : ""}</span>
              </div>
            )
          })}
        </div>
      </div>

      <p className="build-source">{source}</p>

      {hovered !== null && <Tip project={projects[hovered]} week={week} spot={spot} />}

      <table className="sr-only">
        <caption>Lines of code per public repository as of {shortDay(weeks[LAST])}. {source}</caption>
        <thead><tr><th scope="col">Project</th>{shown.map((name) => <th scope="col" key={name}>{name}</th>)}<th scope="col">Commits</th></tr></thead>
        <tbody>
          {projects.map((project) => (
            <tr key={project.name}>
              <th scope="row">{project.name}</th>
              {shown.map((name) => <td key={name}>{number(project.lines[name]?.[LAST] ?? 0)}</td>)}
              <td>{commitsTo(project, LAST)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}
