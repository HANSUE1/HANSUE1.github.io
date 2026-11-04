import { useState } from "react"
import AboutChapters, { PORTAL_LENGTH } from "@/components/about-chapters"
import GlyphPortal, { type GlyphPortalStyle } from "@/components/ui/glyph-portal"
import Iridescence from "@/components/ui/Iridescence"

// The dev title: "Software developer", on two lines, cut out of a live iridescent surface (React Bits Iridescence). Scrolling flies
// the camera into one letter (hover or arrow keys choose which) until the surface fills the screen and the chapters
// inside appear on it (about-chapters.tsx). The surface still follows the pointer and swirls on click. Styling: css/main.css (.name-portal).
export const TITLE_WORD = "Software\ndeveloper"

const STYLE: GlyphPortalStyle = {
  "--gp-paper": "transparent", // the page's own dotted backdrop shows around the words
  "--gp-ink": "#f8f7f7",
  "--gp-field": "#cfd4e4", // pale chrome under the surface: shown without WebGL, and behind the copy with reduced motion
  "--gp-foreground": "#121014", // dark copy reads on the light iridescent surface
  fontFamily: "var(--font-copy)",
}

// The surface's mood in each chapter, in CHAPTERS order. It glides between these (LOOK in Iridescence.jsx).
const LOOKS = [
  { hueShift: 0, saturation: 0.55, brightness: 1, contrast: 0.85, warp: 1, scale: 1.4, sheen: 0.3 }, // pale chrome
  { hueShift: 0, saturation: 1.1, brightness: 0.13, contrast: 1.15, warp: 1.2, scale: 1.1, sheen: 2 }, // a dark room and a searchlight
  { hueShift: 205, saturation: 0.6, brightness: 1, contrast: 0.85, warp: 1.8, scale: 2.2, sheen: 0.3 }, // blueprint
  { hueShift: 70, saturation: 0.75, brightness: 1.02, contrast: 0.8, warp: 0.7, scale: 1.1, sheen: 0.4 }, // warm
]

export default function NamePortal({ fontFamily }: { fontFamily: string }) {
  const [chapter, setChapter] = useState(0)
  return (
    <GlyphPortal
      word={TITLE_WORD}
      fontFamily={fontFamily}
      fontWeight={800}
      scrollLength={PORTAL_LENGTH}
      enterLabel=""
      className="name-portal"
      style={STYLE}
      background={
        // Inside GlyphPortal's inert field; the wrapper keeps the component's slow push-in (--gp-field-scale) on scroll.
        <div className="portal-field">
          <Iridescence
            color={[1, 1, 1]}
            speed={1}
            detail={8}
            rotation={0}
            mouseReact={true}
            amplitude={0.1}
            stir={0.35}
            clickSwirl={true}
            grain={0}
            fade={0}
            resolution={0.75}
            {...LOOKS[chapter]}
          />
        </div>
      }
      front={<p className="portal-quote">“You must do the thing you think you cannot do.”</p>}
    >
      <AboutChapters chapter={chapter} onChapter={setChapter} />
    </GlyphPortal>
  )
}
