import GlyphPortal, { type GlyphPortalStyle } from "@/components/ui/glyph-portal"

// The page's opening title: "HANS" in the display face, its letters cut out of an orange field. Scrolling flies
// the camera into one letter (hover or arrow keys choose which) until the field fills the screen, and the copy
// below appears inside it. Colours are the site's own tokens; the styling lives in css/main.css (.name-portal).
const STYLE: GlyphPortalStyle = {
  "--gp-paper": "transparent", // the page's own dotted backdrop shows around the word
  "--gp-ink": "#f8f7f7",
  "--gp-field": "#ff6d37",
  "--gp-foreground": "#1a0d07", // dark copy on the orange field (white on orange fails contrast)
  fontFamily: "var(--font-copy)",
}

export default function NamePortal({ fontFamily }: { fontFamily: string }) {
  return (
    <GlyphPortal
      word="HANS"
      fontFamily={fontFamily}
      fontWeight={800}
      scrollLength={1.8}
      enterLabel="Step inside"
      className="name-portal"
      style={STYLE}
      background={<div className="portal-field" />}
      front={<p className="portal-surname">Curt Austin C. Santos</p>}
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
            <h3>Play</h3>
            <p>Games made in Godot, alongside the data tools and web apps.</p>
          </div>
        </div>
      </div>
    </GlyphPortal>
  )
}
