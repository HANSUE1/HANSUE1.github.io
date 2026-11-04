import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type RefObject } from "react"
import { startPile } from "@/lib/brick-pile"

// What you find inside the letter once the dev title's camera lands: four chapters, each with its verb built into the
// pointer. About is a magnifying lens, Investigate recovers redacted words, Build throws bricks around, Collaborate
// brings a second cursor. The dock at the bottom centre switches chapters with a fade; scrolling walks through them too,
// so nobody misses the copy. With reduced motion or without WebGL the plain copy below shows instead.
// Styling: css/components/about-chapters.css. The surface's look per chapter: LOOKS in name-portal.tsx.

export const CHAPTERS = [
  { id: "about", label: "About" },
  { id: "investigate", label: "Investigate" },
  { id: "build", label: "Build" },
  { id: "collaborate", label: "Collaborate" },
] as const

/** Must match scrollLength on the GlyphPortal. */
export const PORTAL_LENGTH = 1.8
/** Scroll per chapter, in screen heights. The spacer after .name-portal in about-chapters.css makes room for them. */
const CHAPTER_STEP = 0.75

const STATEMENT = "Computer Science at National University, specializing in Digital Forensics."
const INVESTIGATE = "Digital forensics, and Python tools that pull data out of the web responsibly."
const BUILD = "Full-stack web apps in React and TypeScript on Supabase, like e-Barangay."
const BRICKS = ["React", "TypeScript", "Supabase", "e-Barangay", "Python", "JavaScript", "MongoDB", "Java", "C++", "HTML", "CSS"]
const FEATURED = new Set(["React", "TypeScript", "Supabase", "e-Barangay"])

const noHover = () => window.matchMedia("(hover: none)").matches

type PanelProps = { running: boolean }

function hasWebGL() {
  try {
    return Boolean(document.createElement("canvas").getContext("webgl2"))
  } catch {
    return false
  }
}

/** Tracks the pointer in `host`'s coordinates; `seen` stays false until it first moves. */
function usePointer(host: RefObject<HTMLElement | null>, running: boolean) {
  const pointer = useRef({ x: 0, y: 0, seen: false, movedAt: 0 })
  useEffect(() => {
    if (!running) return
    const state = pointer.current
    state.seen = false
    const move = (event: PointerEvent) => {
      const rect = host.current?.getBoundingClientRect()
      if (!rect) return
      state.x = event.clientX - rect.left
      state.y = event.clientY - rect.top
      state.seen = true
      state.movedAt = performance.now()
    }
    window.addEventListener("pointermove", move, { passive: true })
    return () => window.removeEventListener("pointermove", move)
  }, [host, running])
  return pointer
}

function AboutPanel({ running }: PanelProps) {
  const root = useRef<HTMLDivElement>(null)
  const pointer = usePointer(root, running)

  useEffect(() => {
    const host = root.current
    if (!running || !host) return
    const started = performance.now()
    let x = host.clientWidth * 0.3
    let y = host.clientHeight * 0.45
    let raf = 0
    const frame = (now: number) => {
      const t = (now - started) / 1000
      const { seen, x: px, y: py, movedAt } = pointer.current
      // Until the pointer takes over, and again once it rests or goes down to the dock, the lens drifts across the statement.
      const free = !seen || now - movedAt > 3500 || py > host.clientHeight - 120
      const tx = free ? host.clientWidth * (0.36 + 0.26 * Math.sin(t * 0.55)) : px
      const ty = free ? host.clientHeight * (0.44 + 0.16 * Math.sin(t * 0.83 + 1)) : py
      const follow = free ? 0.025 : 0.16
      x += (tx - x) * follow
      y += (ty - y) * follow
      host.style.setProperty("--lens-x", `${x.toFixed(1)}px`)
      host.style.setProperty("--lens-y", `${y.toFixed(1)}px`)
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [running, pointer])

  return (
    <div className="about-lens-host" ref={root}>
      <div className="about-stage about-stage--about">
        <h2 className="about-statement">{STATEMENT}</h2>
      </div>
      <div className="about-lens" aria-hidden="true">
        <div className="about-lens-view">
          <div className="about-stage about-stage--about">
            <p className="about-statement">{STATEMENT}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function InvestigatePanel({ running }: PanelProps) {
  const sentence = useRef<HTMLParagraphElement>(null)
  const words = INVESTIGATE.split(" ")
  const [recovered, setRecovered] = useState(0)

  useEffect(() => {
    const host = sentence.current
    if (!running || !host) return
    const spans = Array.from(host.querySelectorAll<HTMLElement>(".about-word"))
    for (const span of spans) delete span.dataset.recovered
    setRecovered(0)
    let count = 0
    let timer = 0
    const recover = (span: HTMLElement) => {
      if (span.dataset.recovered) return
      span.dataset.recovered = "true"
      count += 1
      setRecovered(count)
    }
    // Nothing stays hidden: without a mouse, or left alone, the bars lift by themselves one after another.
    const sweep = () => {
      const next = spans.find((span) => !span.dataset.recovered)
      if (!next) return
      recover(next)
      timer = window.setTimeout(sweep, 120)
    }
    const wait = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(sweep, noHover() ? 900 : 5000)
    }
    const move = (event: PointerEvent) => {
      if (event.pointerType === "mouse") wait()
      for (const span of spans) {
        const rect = span.getBoundingClientRect()
        const near = event.clientX > rect.left - 24 && event.clientX < rect.right + 24 && event.clientY > rect.top - 20 && event.clientY < rect.bottom + 20
        if (near) recover(span)
      }
    }
    wait()
    window.addEventListener("pointermove", move, { passive: true })
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener("pointermove", move)
    }
  }, [running])

  const done = recovered === words.length
  return (
    <div className="about-stage about-stage--investigate">
      <h3 className="about-verb">Investigate</h3>
      <div className="about-case">
        <p className="about-sentence" ref={sentence}>
          {words.map((word, i) => (
            <span key={i}>
              <span className="about-word">{word}</span>{" "}
            </span>
          ))}
        </p>
        <p className="about-note" aria-hidden="true">
          {done ? `All ${words.length} words recovered` : `Move across the bars to recover the text. ${recovered} of ${words.length}`}
        </p>
      </div>
    </div>
  )
}

function BuildPanel({ running }: PanelProps) {
  const pit = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (running && pit.current) return startPile(pit.current)
  }, [running])

  return (
    <div className="about-stage about-stage--build">
      <h3 className="about-verb">Build</h3>
      <div className="about-brief">
        <p className="about-sentence">{BUILD}</p>
        <p className="about-note" aria-hidden="true">Pick a brick up and throw it.</p>
      </div>
      <div className="about-pit" ref={pit} aria-hidden="true">
        {BRICKS.map((brick) => (
          <span className="about-chip" data-featured={FEATURED.has(brick) || undefined} key={brick}>{brick}</span>
        ))}
      </div>
    </div>
  )
}

function CollaboratePanel({ running }: PanelProps) {
  const root = useRef<HTMLDivElement>(null)
  const peer = useRef<HTMLDivElement>(null)
  const pointer = usePointer(root, running)

  useEffect(() => {
    const host = root.current
    const cursor = peer.current
    if (!running || !host || !cursor) return
    const roles = Array.from(host.querySelectorAll<HTMLElement>(".about-role"))
    const invite = host.querySelector<HTMLElement>(".about-invite")!
    const stops = [...roles, invite]
    const started = performance.now()
    const anchor = (el: HTMLElement) => {
      const box = host.getBoundingClientRect()
      const rect = el.getBoundingClientRect()
      return { x: rect.right - box.left - Math.min(26, rect.width / 3), y: rect.bottom - box.top - 8 }
    }
    let x = host.clientWidth / 2
    let y = host.clientHeight
    let lean = 0
    let raf = 0
    const frame = (now: number) => {
      const { seen, x: px, y: py, movedAt } = pointer.current
      const resting = !seen || now - movedAt > 2200
      // Beside your cursor while you move; left alone, Hans walks the roles and ends on the invite.
      const stop = stops[Math.floor((now - started) / 1500) % stops.length]
      const hovered = seen && !resting ? stops.find((el) => {
        const box = host.getBoundingClientRect()
        const rect = el.getBoundingClientRect()
        return px + box.left > rect.left && px + box.left < rect.right && py + box.top > rect.top && py + box.top < rect.bottom
      }) : undefined
      const goal = hovered ?? (resting ? stop : undefined)
      const target = goal ? anchor(goal) : { x: px + 40, y: py + 34 }
      const dx = (target.x - x) * 0.085
      const dy = (target.y - y) * 0.085
      x += dx
      y += dy
      lean += (Math.max(-14, Math.min(14, dx * 1.1)) - lean) * 0.14
      cursor.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) rotate(${lean.toFixed(2)}deg)`
      const arrived = goal && Math.hypot(target.x - x, target.y - y) < 60 ? goal : undefined
      for (const el of stops) el.toggleAttribute("data-selected", el === arrived)
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      for (const el of stops) el.removeAttribute("data-selected")
    }
  }, [running, pointer])

  return (
    <div className="about-stage about-stage--collaborate" ref={root}>
      <h3 className="about-verb">Collaborate</h3>
      <p className="about-sentence">
        Open to <span className="about-role">internships</span>, <span className="about-role">full-time roles</span> and{" "}
        <span className="about-role">freelance work</span>.
      </p>
      <a className="about-invite" href="#contact">
        Get in touch
        <svg className="icon" aria-hidden="true"><use href="#i-arrow-ne" /></svg>
      </a>
      <div className="about-peer" ref={peer} aria-hidden="true">
        <svg viewBox="0 0 24 24" width="24" height="24"><path d="M4 3.2 20.4 10a.9.9 0 0 1-.06 1.68l-6.5 2.1-2.1 6.5A.9.9 0 0 1 10.05 20.3L3.2 4a.62.62 0 0 1 .8-.8Z" /></svg>
        <span>Hans</span>
      </div>
    </div>
  )
}

function Dock({ chapter, onSelect }: { chapter: number; onSelect: (next: number, focus?: boolean) => void }) {
  const dock = useRef<HTMLDivElement>(null)

  // The white thumb slides under the current tab. Tabs change width on phones, so it is measured, not computed.
  useLayoutEffect(() => {
    const host = dock.current
    if (!host) return
    const place = () => {
      const tab = host.querySelector<HTMLElement>('[aria-selected="true"]')
      if (!tab) return
      host.style.setProperty("--thumb-x", `${tab.offsetLeft}px`)
      host.style.setProperty("--thumb-w", `${tab.offsetWidth}px`)
    }
    place()
    const observer = new ResizeObserver(place)
    observer.observe(host)
    document.fonts?.ready.then(place)
    return () => observer.disconnect()
  }, [chapter])

  const onKeyDown = (event: KeyboardEvent) => {
    const last = CHAPTERS.length - 1
    const next = { ArrowLeft: Math.max(0, chapter - 1), ArrowRight: Math.min(last, chapter + 1), Home: 0, End: last }[event.key]
    if (next === undefined) return
    event.preventDefault()
    onSelect(next, true)
  }

  return (
    <div className="about-dock" role="tablist" aria-label="About Hans" ref={dock} onKeyDown={onKeyDown}>
      <span className="about-thumb" aria-hidden="true" />
      {CHAPTERS.map(({ id, label }, i) => (
        <button
          className="about-tab" type="button" role="tab" key={id} id={`about-tab-${id}`} aria-label={label}
          aria-selected={i === chapter} aria-controls={`about-panel-${id}`} tabIndex={i === chapter ? 0 : -1} onClick={() => onSelect(i)}
        >
          <span>{label}</span>
        </button>
      ))}
    </div>
  )
}

export default function AboutChapters({ chapter, onChapter }: { chapter: number; onChapter: (next: number) => void }) {
  const root = useRef<HTMLDivElement>(null)
  const current = useRef(chapter)
  current.current = chapter
  const [live, setLive] = useState(false)
  const [onScreen, setOnScreen] = useState(false)

  // GlyphPortal decides in its first frames whether its motion runs. The chapters only run on top of that.
  useEffect(() => {
    const section = root.current?.closest<HTMLElement>(".name-portal")
    if (!section) return
    const webgl = hasWebGL()
    const sync = () => setLive(webgl && section.dataset.gpMotion === "on")
    sync()
    const observer = new MutationObserver(sync)
    observer.observe(section, { attributes: true, attributeFilter: ["data-gp-motion"] })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const host = root.current
    const section = host?.closest<HTMLElement>(".name-portal")
    if (!live || !host || !section) {
      onChapter(0)
      return
    }
    const seen = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), { threshold: 0.3 })
    seen.observe(host)
    const update = () => {
      const screen = section.querySelector<HTMLElement>("[data-gp-pin]")!.clientHeight
      const landed = -section.getBoundingClientRect().top - screen * PORTAL_LENGTH
      const next = Math.max(0, Math.min(CHAPTERS.length - 1, Math.floor(landed / (screen * CHAPTER_STEP))))
      if (next !== current.current) onChapter(next)
    }
    window.addEventListener("scroll", update, { passive: true })
    window.addEventListener("resize", update)
    update()
    return () => {
      seen.disconnect()
      window.removeEventListener("scroll", update)
      window.removeEventListener("resize", update)
    }
  }, [live, onChapter])

  // The screen is pinned here, so jumping the scroll position shows nothing but the chapter's fade.
  const select = (next: number, focus = false) => {
    const section = root.current?.closest<HTMLElement>(".name-portal")
    if (!section) return
    const screen = section.querySelector<HTMLElement>("[data-gp-pin]")!.clientHeight
    const top = window.scrollY + section.getBoundingClientRect().top + screen * (PORTAL_LENGTH + next * CHAPTER_STEP) + 2
    window.scrollTo({ top, behavior: "instant" })
    onChapter(next)
    if (focus) document.getElementById(`about-tab-${CHAPTERS[next].id}`)?.focus({ preventScroll: true })
  }

  if (!live) {
    return (
      <div className="about" ref={root}>
        <div className="portal-copy">
          <h2>{STATEMENT}</h2>
          <div className="portal-points">
            <div><h3>Investigate</h3><p>{INVESTIGATE}</p></div>
            <div><h3>Build</h3><p>{BUILD}</p></div>
            <div><h3>Collaborate</h3><p>Open to internships, full-time roles and freelance work.</p></div>
          </div>
        </div>
      </div>
    )
  }

  const panels = [AboutPanel, InvestigatePanel, BuildPanel, CollaboratePanel]
  return (
    <div className="about about--live" ref={root} data-chapter={CHAPTERS[chapter].id}>
      {CHAPTERS.map(({ id }, i) => {
        const Panel = panels[i]
        const active = i === chapter
        return (
          <section
            className={`about-panel about-panel--${id}`} key={id} id={`about-panel-${id}`} role="tabpanel"
            aria-labelledby={`about-tab-${id}`} data-active={active} inert={!active}
          >
            <Panel running={active && onScreen} />
          </section>
        )
      })}
      <Dock chapter={chapter} onSelect={select} />
    </div>
  )
}
