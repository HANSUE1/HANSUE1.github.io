import GlyphPortal, { type GlyphPortalStyle } from "@/components/ui/glyph-portal"
import Iridescence from "@/components/ui/Iridescence"

// The dev title: "SOFTWARE DEVELOPER" cut out of a live iridescent surface (React Bits Iridescence). Scrolling flies
// the camera into one letter (hover or arrow keys choose which) until the surface fills the screen and the copy
// below appears on it. The surface still follows the pointer and swirls on click. Styling: css/main.css (.name-portal).
export const TITLE_WORD = "SOFTWARE DEVELOPER"

const STYLE: GlyphPortalStyle = {
  "--gp-paper": "transparent", // the page's own dotted backdrop shows around the words
  "--gp-ink": "#f8f7f7",
  "--gp-field": "#cfd4e4", // pale chrome under the surface: shown without WebGL, and behind the copy with reduced motion
  "--gp-foreground": "#121014", // dark copy reads on the light iridescent surface
  fontFamily: "var(--font-copy)",
}

// Inside GlyphPortal's inert field; the wrapper keeps the component's slow push-in (--gp-field-scale) on scroll.
const SURFACE = (
  <div className="portal-field">
    <Iridescence
      color={[1, 1, 1]}
      hueShift={0}
      saturation={0.55}
      brightness={1}
      contrast={0.85}
      speed={1}
      scale={1.4}
      detail={8}
      warp={1}
      rotation={0}
      mouseReact={true}
      amplitude={0.1}
      stir={0.35}
      sheen={0.3}
      clickSwirl={true}
      grain={0}
      fade={0}
      resolution={0.75}
    />
  </div>
)

export default function NamePortal({ fontFamily }: { fontFamily: string }) {
  return (
    <GlyphPortal
      word={TITLE_WORD}
      fontFamily={fontFamily}
      fontWeight={800}
      scrollLength={1.8}
      enterLabel=""
      className="name-portal"
      style={STYLE}
      background={SURFACE}
      front={<p className="portal-quote">“You must do the thing you think you cannot do.”</p>}
    >
      <div className="portal-copy">
        <h2>Computer Science at National University, specializing in Digital Forensics.</h2>
        <div className="portal-points">
          <div>
            <h3>Investigate</h3>
            <p>Digital forensics, and Python tools that pull data out of the web responsibly.</p>
          </div>
          <div>
            <h3>Build</h3>
            <p>Full-stack web apps in React and TypeScript on Supabase, like e-Barangay.</p>
          </div>
          <div>
            <h3>Collaborate</h3>
            <p>Open to internships, full-time roles and freelance work.</p>
          </div>
        </div>
      </div>
    </GlyphPortal>
  )
}
