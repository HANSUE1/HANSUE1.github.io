import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent, type ReactNode } from "react"
import history from "@/data/build-history.json"

// The Build chapter: every public repo as a building, its height the real line count, one floor per language. The city
// rises through the actual git history when the chapter opens, the timeline rewinds it, dragging spins it, and pointing
// at a building pulls its floors apart. Drawn with CSS 3D and no perspective, so a height means the same anywhere on
// the block. The numbers come from tools/build-history.py. Styling: css/components/about-chapters.css.

type Project = { name: string; url: string; lines: Record<string, number[]>; commits: number[] }

const projects = history.projects as unknown as Project[]
const { weeks, measured } = history
const LAST = weeks.length - 1
const STEP_MS = 420

/** A language keeps its slot whatever else is on screen. This order passes the palette validator. */
const LANGUAGES = ["JavaScript", "Python", "HTML", "TypeScript", "CSS", "Java", "C++", "SQL"]
const COLORS = ["#3987e5", "#d95926", "#199e70", "#c98500", "#d55181", "#008300", "#9085e9", "#e66767"]
const shown = LANGUAGES.filter((language) => projects.some((project) => project.lines[language]))
const color = (language: string) => COLORS[LANGUAGES.indexOf(language)]

/** Back of the block to the front. Projects are sorted by size, so the tallest never hide the smallest. */
const LOTS = [[0, 0], [1, 0], [0, 1], [2, 0], [1, 1], [0, 2], [2, 1], [1, 2], [2, 2]]

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

function Cube({ className, style, empty, ghost, children }: { className: string; style: CSSProperties; empty?: boolean; ghost?: boolean; children?: ReactNode }) {
  return (
    <div className={`city-cube ${className}`} style={style} data-empty={empty || undefined} data-ghost={ghost || undefined}>
      <i className="city-face city-face--top" />
      <i className="city-face city-face--front" />
      <i className="city-face city-face--back" />
      <i className="city-face city-face--right" />
      <i className="city-face city-face--left" />
      {children}
    </div>
  )
}

export default function BuildCity({ running }: { running: boolean }) {
  const [week, setWeek] = useState(0)
  const [language, setLanguage] = useState<string | null>(null)
  const [hovered, setHovered] = useState<number | null>(null)
  const [pinned, setPinned] = useState<number | null>(null)
  const [size, setSize] = useState({ plate: 320, lift: 0 })
  const scene = useRef<HTMLDivElement>(null)
  const plate = useRef<HTMLDivElement>(null)
  const timer = useRef(0)
  const at = useRef(0)
  at.current = week
  const spin = useRef({ held: false, x: 0, angle: 0, speed: 0, moved: 0 })

  const stop = useCallback(() => window.clearTimeout(timer.current), [])
  // Builds forward from a week to today. Also how the city recovers after being rewound.
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
    play(0, 750) // waits for the chapter's fade
    return () => {
      stop()
      setWeek(0)
      setHovered(null)
      setPinned(null)
    }
  }, [running, play, stop])

  // The block fills whatever room the stage leaves it, with the towers counted in.
  useLayoutEffect(() => {
    const host = scene.current
    if (!host) return
    const fit = () => {
      const side = Math.max(110, Math.min(host.clientWidth / 1.5, host.clientHeight / 1.5))
      setSize({ plate: Math.round(side), lift: Math.round(side * 0.32) })
    }
    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(host)
    return () => observer.disconnect()
  }, [])

  // The camera: it swings in, leans towards the pointer, sways a little when left alone, and keeps any spin you give it.
  useEffect(() => {
    const host = plate.current
    if (!running || !host) return
    const state = spin.current
    const started = performance.now()
    let intro = -85
    let yaw = 45 + intro
    let tilt = 60
    let leanX = 0
    let leanY = 0
    let raf = 0
    const frame = (now: number) => {
      const t = (now - started) / 1000
      intro *= 0.955
      if (!state.held) {
        state.angle += state.speed
        state.speed *= 0.94
      }
      yaw += (45 + intro + state.angle + leanX * 24 + Math.sin(t * 0.35) * 5 - yaw) * 0.08
      tilt += (60 - leanY * 9 - tilt) * 0.08
      host.style.setProperty("--yaw", `${yaw.toFixed(2)}deg`)
      host.style.setProperty("--tilt", `${tilt.toFixed(2)}deg`)
      raf = requestAnimationFrame(frame)
    }
    const move = (event: globalThis.PointerEvent) => {
      if (event.pointerType === "mouse") {
        leanX = (event.clientX / window.innerWidth - 0.5) * 2
        leanY = (event.clientY / window.innerHeight - 0.5) * 2
      }
      if (!state.held) return
      const dx = event.clientX - state.x
      state.x = event.clientX
      state.angle += dx * 0.35
      state.speed = dx * 0.35
      state.moved += Math.abs(dx)
    }
    const release = () => { state.held = false }
    raf = requestAnimationFrame(frame)
    window.addEventListener("pointermove", move, { passive: true })
    window.addEventListener("pointerup", release)
    window.addEventListener("pointercancel", release)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", release)
      window.removeEventListener("pointercancel", release)
      state.held = false
      state.angle = 0
      state.speed = 0
    }
  }, [running])

  const grab = (event: PointerEvent) => {
    spin.current.held = true
    spin.current.x = event.clientX
    spin.current.speed = 0
    spin.current.moved = 0
  }

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

  const tower = size.plate * 0.74
  const cell = size.plate / 3
  const footprint = cell * 0.66
  const active = language ? null : hovered ?? pinned // a language filter looks across the whole city
  const lines = sumOf((project) => linesAt(project, week))
  const commits = sumOf((project) => commitsTo(project, week))
  const started = projects.filter((project) => linesAt(project, week) > 0).length
  const picked = active === null ? null : projects[active]
  const source = `Measured from git history on ${day(measured, { month: "short", day: "numeric", year: "numeric" })}. Lockfiles, build output and generated files aren't counted. e-Barangay was uploaded in one commit, so it lands in a single week.`

  return (
    <figure className="city" aria-label={`A city of ${projects.length} public repositories. Building height is lines of code, floors are languages`}>
      <div className="city-scene" ref={scene} onPointerDown={grab} onPointerLeave={() => setHovered(null)}>
        <div className="city-plate" ref={plate} style={{ "--p": `${size.plate}px`, "--lift": `${size.lift}px`, "--f": `${footprint}px` } as CSSProperties}>
          <Cube className="city-base" style={{ "--h": `${Math.round(size.plate * 0.05)}px`, "--z": `${-Math.round(size.plate * 0.05)}px`, "--f": `${size.plate}px` } as CSSProperties} />
          <div className="city-ground" onPointerEnter={(event) => { if (event.pointerType === "mouse") setHovered(null) }} onClick={() => { if (spin.current.moved < 6) setPinned(null) }} />
          <p className="city-stamp" aria-hidden="true">{shortDay(weeks[week])}</p>
          {projects.map((project, i) => {
            const open = i === active
            const parts = shown.filter((name) => project.lines[name])
            let base = 0
            let standing = 0
            const floors = parts.map((name) => {
              const count = project.lines[name][week]
              const height = count ? Math.max(2, (count / longest) * tower) : 0
              const floor = { name, count, height, z: base, level: standing }
              base += height
              if (count) standing += 1
              return floor
            })
            const [col, row] = LOTS[i]
            const toggle = () => setPinned((current) => (current === i ? null : i))
            return (
              <div
                className="city-lot" key={project.name} role="button" tabIndex={0} data-open={open || undefined} data-dim={(active !== null && !open) || undefined}
                aria-label={`${project.name}: ${plural(linesAt(project, week), "line")}, ${plural(commitsTo(project, week), "commit")}`} aria-pressed={pinned === i}
                style={{ left: col * cell + (cell - footprint) / 2, top: row * cell + (cell - footprint) / 2, "--top": `${base}px`, "--gap": open ? `${Math.max(16, size.plate * 0.075)}px` : "0px", "--n": Math.max(0, standing - 1) } as CSSProperties}
                onPointerEnter={(event) => { if (event.pointerType === "mouse") setHovered(i) }}
                onClick={() => { if (spin.current.moved < 6) toggle() }}
                onFocus={() => setHovered(i)} onBlur={() => setHovered(null)}
                onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); toggle() } }}
              >
                <i className="city-pad" />
                {/* An empty floor stays mounted at zero height, so it rises from the ground when its language arrives. */}
                {floors.map((floor) => (
                  <Cube
                    className="city-floor" key={floor.name} empty={!floor.count} ghost={language !== null && language !== floor.name} style={{ "--h": `${floor.height}px`, "--z": `${floor.z}px`, "--i": floor.level, "--c": color(floor.name) } as CSSProperties}
                  >
                    {open && floor.count > 0 && <span className="city-floor-tag"><b>{number(floor.count)}</b> {floor.name}</span>}
                  </Cube>
                ))}
                <Cube className="city-shaft" style={{ "--h": "calc(var(--top) + var(--gap) * var(--n) + 6px)", "--z": "0px" } as CSSProperties} />
                {base > 0 && !open && (size.plate >= 300 || i < 3) && <span className="city-tag">{project.name}</span>}
              </div>
            )
          })}
        </div>
      </div>

      <p className="city-readout">
        {picked ? (
          <>
            <strong>{number(linesAt(picked, week))}</strong> lines in {picked.name}, {plural(commitsTo(picked, week), "commit")}
            {pinned === active && <> · <a href={picked.url} target="_blank" rel="noopener noreferrer">View repo</a></>}
          </>
        ) : (
          <><strong>{number(lines)}</strong> lines, {plural(commits, "commit")}, {plural(started, "public repo")} by {shortDay(weeks[week])}</>
        )}
      </p>

      <ul className="city-legend" aria-label="Languages">
        {shown.map((name) => (
          <li key={name}>
            <button
              type="button" data-on={language === name || undefined} onPointerEnter={(event) => { if (event.pointerType === "mouse") setLanguage(name) }} onPointerLeave={() => setLanguage(null)}
              onFocus={() => setLanguage(name)} onBlur={() => setLanguage(null)}
            >
              <i style={{ background: color(name) }} />{name}
            </button>
          </li>
        ))}
      </ul>

      <div className="city-controls">
        <button className="city-replay" type="button" aria-label="Replay" onClick={() => play(0, 0)}>
          <svg className="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.6-5.9M4 4v4.5h4.5" /></svg>
        </button>
        <div
          className="city-time" role="slider" tabIndex={0} aria-label="Week shown" aria-valuemin={0} aria-valuemax={LAST} aria-valuenow={week}
          aria-valuetext={`Week of ${shortDay(weeks[week])}: ${plural(lines, "line")}, ${plural(weekCommits[week], "commit")} that week`}
          onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); scrub(event) }} onPointerMove={scrub} onPointerUp={resume} onPointerLeave={resume} onKeyDown={onTimeKey}
        >
          {weeks.map((date, i) => {
            const fresh = i === 0 || month(date) !== month(weeks[i - 1])
            return (
              <div className="city-week" key={date} data-past={i <= week || undefined} data-now={i === week || undefined}>
                <span className="city-week-bar" style={{ height: `${(weekCommits[i] / busiest) * 100}%` }}>
                  <span className="city-week-count">{weekCommits[i]}</span>
                </span>
                <span className="city-week-month">{fresh ? month(date) : ""}</span>
              </div>
            )
          })}
        </div>
      </div>

      <p className="about-note city-hint">Drag to spin. Point at a building to open it. Slide the commits to rewind. Heights are to scale.</p>

      <div className="sr-only">
        <table>
          <caption>Lines of code per public repository as of {shortDay(weeks[LAST])}. {source}</caption>
          <thead><tr><th scope="col">Project</th>{shown.map((name) => <th scope="col" key={name}>{name}</th>)}<th scope="col">Commits</th></tr></thead>
          <tbody>
            {projects.map((project) => (
              <tr key={project.name}>
                <th scope="row"><a href={project.url}>{project.name}</a></th>
                {shown.map((name) => <td key={name}>{number(project.lines[name]?.[LAST] ?? 0)}</td>)}
                <td>{commitsTo(project, LAST)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  )
}
