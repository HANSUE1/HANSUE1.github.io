// React island for the opening title: mounts NamePortal into #name-portal once the display face is ready.
// GlyphPortal measures the letters' ink when it mounts and stays static if its font is still loading, so wait for
// Poppins (as the component's own demo does), with a timeout so a slow font never holds the title back.
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import NamePortal, { TITLE_WORD } from "@/components/name-portal"

declare global {
  interface Window {
    ScrollTrigger?: { refresh: () => void }
  }
}

const DISPLAY = "800 100px Poppins"
const FALLBACK = '"Arial Black", Arial, sans-serif'

const host = document.getElementById("name-portal")
if (host) {
  const timeout = new Promise<void>((done) => setTimeout(done, 1600))
  Promise.race([document.fonts.load(DISPLAY, TITLE_WORD).then(() => undefined), timeout])
    .catch(() => undefined)
    .then(() => {
      const face = document.fonts.check(DISPLAY, TITLE_WORD) ? `Poppins, ${FALLBACK}` : FALLBACK
      createRoot(host).render(
        <StrictMode>
          <NamePortal fontFamily={face} />
        </StrictMode>,
      )
      // The portal's scroll travel changes the page height once it lays out; GSAP's scroll triggers further down
      // were measured against the placeholder, so re-measure them whenever the portal's height settles.
      let frame = 0
      new ResizeObserver(() => {
        cancelAnimationFrame(frame)
        frame = requestAnimationFrame(() => window.ScrollTrigger?.refresh())
      }).observe(host)
    })
}
