// The Build chapter's physics: every .about-chip in the pit becomes a rigid body. They fall in one by one and pile up
// on the pit's floor; the mouse shoves them, and any brick can be picked up and thrown. Matter's own MouseConstraint
// isn't used because it swallows wheel and touch scrolling on the element it watches. Returns a function that stops it.
import Matter from "matter-js"

const STEP = 1000 / 60
const WALL = 400
const DROP_GAP = 110

export function startPile(pit: HTMLElement): () => void {
  const { Bodies, Body, Composite, Constraint, Engine } = Matter
  const engine = Engine.create({ gravity: { x: 0, y: 1.3, scale: 0.001 }, positionIterations: 8, velocityIterations: 6 })
  const world = engine.world
  let width = pit.clientWidth
  let height = pit.clientHeight

  const wall = (x: number, y: number, w: number, h: number) => Bodies.rectangle(x, y, w, h, { isStatic: true, friction: 0.7 })
  const floor = wall(width / 2, height + WALL / 2, width + WALL * 2, WALL)
  const left = wall(-WALL / 2, 0, WALL, height * 12)
  const right = wall(width + WALL / 2, 0, WALL, height * 12)
  const roof = wall(width / 2, -height * 3 - WALL / 2, width + WALL * 2, WALL)
  const pusher = Bodies.circle(0, -height * 2, 36, { isStatic: true })
  Composite.add(world, [floor, left, right, roof, pusher])

  const chips = Array.from(pit.querySelectorAll<HTMLElement>(".about-chip"))
  const bricks = chips.map((el, i) => {
    const w = el.offsetWidth
    const h = el.offsetHeight
    const spread = (i * 0.618034) % 1 // the golden ratio spaces the drop points evenly without a visible pattern
    const x = w / 2 + spread * Math.max(1, width - w)
    const body = Bodies.rectangle(x, -h - 20, w, h, {
      chamfer: { radius: h * 0.32 }, angle: (spread - 0.5) * 0.7, friction: 0.55, frictionAir: 0.012, restitution: 0.22, density: 0.0016,
    })
    return { el, body, w, h, added: false, at: i * DROP_GAP }
  })

  let grab: Matter.Constraint | null = null
  let grabbed: HTMLElement | null = null
  const toPit = (event: PointerEvent) => {
    const rect = pit.getBoundingClientRect()
    return { x: Math.min(width, Math.max(0, event.clientX - rect.left)), y: Math.max(-height, Math.min(height, event.clientY - rect.top)) }
  }

  const onDown = (event: PointerEvent) => {
    const brick = bricks.find(({ el }) => el === (event.target as Element).closest(".about-chip"))
    if (!brick || !brick.added) return
    event.preventDefault()
    const point = toPit(event)
    grab = Constraint.create({
      pointA: point, bodyB: brick.body, length: 0, stiffness: 0.16, damping: 0.08,
      pointB: { x: point.x - brick.body.position.x, y: point.y - brick.body.position.y },
    })
    Composite.add(world, grab)
    grabbed = brick.el
    grabbed.setPointerCapture(event.pointerId)
    grabbed.dataset.held = "true"
  }

  const onMove = (event: PointerEvent) => {
    if (grab) {
      grab.pointA = toPit(event)
      return
    }
    if (event.pointerType !== "mouse") return
    const rect = pit.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    const inside = x > 0 && x < width && y > -height && y < height
    const to = inside ? { x, y } : { x: 0, y: -height * 2 }
    Body.setVelocity(pusher, inside ? { x: to.x - pusher.position.x, y: to.y - pusher.position.y } : { x: 0, y: 0 })
    Body.setPosition(pusher, to)
  }

  const onUp = () => {
    if (!grab || !grabbed) return
    Composite.remove(world, grab)
    delete grabbed.dataset.held
    grab = null
    grabbed = null
  }

  const resize = () => {
    width = pit.clientWidth
    height = pit.clientHeight
    Body.setPosition(floor, { x: width / 2, y: height + WALL / 2 })
    Body.setPosition(right, { x: width + WALL / 2, y: 0 })
    Body.setPosition(roof, { x: width / 2, y: -height * 3 - WALL / 2 })
    for (const { body } of bricks) {
      const x = Math.min(width - 10, Math.max(10, body.position.x))
      const y = Math.min(height - 10, body.position.y)
      if (x !== body.position.x || y !== body.position.y) Body.setPosition(body, { x, y })
    }
  }

  let raf = 0
  const started = performance.now()
  let last = started
  let spare = 0
  const frame = (now: number) => {
    spare += Math.min(50, now - last)
    last = now
    for (const brick of bricks) {
      if (!brick.added && now - started >= brick.at) {
        brick.added = true
        Composite.add(world, brick.body)
      }
    }
    while (spare >= STEP) {
      Engine.update(engine, STEP)
      spare -= STEP
    }
    for (const { el, body, w, h, added } of bricks) {
      if (added) el.style.transform = `translate3d(${body.position.x - w / 2}px,${body.position.y - h / 2}px,0) rotate(${body.angle}rad)`
    }
    raf = requestAnimationFrame(frame)
  }
  raf = requestAnimationFrame(frame)

  const observer = new ResizeObserver(resize)
  observer.observe(pit)
  pit.addEventListener("pointerdown", onDown)
  window.addEventListener("pointermove", onMove, { passive: true })
  window.addEventListener("pointerup", onUp)
  window.addEventListener("pointercancel", onUp)

  return () => {
    cancelAnimationFrame(raf)
    observer.disconnect()
    pit.removeEventListener("pointerdown", onDown)
    window.removeEventListener("pointermove", onMove)
    window.removeEventListener("pointerup", onUp)
    window.removeEventListener("pointercancel", onUp)
    if (grabbed) delete grabbed.dataset.held
    for (const el of chips) el.style.removeProperty("transform")
    Engine.clear(engine)
  }
}
