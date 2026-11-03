import * as React from "react"
import GlassFolder, { type ArtPreset, type FolderFile } from "@/components/ui/glass-folder-cards"
import { cn } from "@/lib/utils"

// The folders hold what index.html already shows, read from its cards once at mount, so every project and
// article is written in one place only.
function readProjects(): FolderFile[] {
  return Array.from(document.querySelectorAll<HTMLAnchorElement>(".project-card")).map((card) => ({
    name: card.querySelector("h3")?.textContent ?? "Project",
    meta: card.querySelector(".project-tags li")?.textContent ?? undefined,
    image: card.querySelector(".project-image img")?.getAttribute("src") ?? undefined,
    href: card.href,
  }))
}

function readArticles() {
  const cards = Array.from(document.querySelectorAll<HTMLButtonElement>(".thought-card"))
  const files: FolderFile[] = cards.map((card) => ({
    name: card.querySelector("strong")?.textContent ?? "Article",
    meta: card.querySelector(".thought-meta span")?.textContent ?? undefined,
  }))
  return { cards, files }
}

// Studies: every press of + paints a new piece from the next preset; the art is seeded by the file name, so no
// two studies are the same picture.
const STUDY_ART: ArtPreset[] = ["dusk", "glacier", "verdant", "ember", "aurora"]
const study = (n: number): FolderFile => {
  const art = STUDY_ART[(n - 1) % STUDY_ART.length]
  return { name: `Study ${n}`, meta: art[0].toUpperCase() + art.slice(1), art }
}

// Two folders a row where they fit at a readable size, otherwise one; never wider than the component's drawn
// 340px. Rounded to 10px so a window resize does not repaint the art for every pixel.
function useFolderWidth(ref: React.RefObject<HTMLDivElement | null>) {
  const [width, setWidth] = React.useState(300)
  React.useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => {
      const room = entry.contentRect.width
      const each = room >= 600 ? (room - 40) / 2 : room
      setWidth(Math.min(340, Math.floor(each / 10) * 10))
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref])
  return width
}

export default function ArchiveDesk({ className }: { className?: string }) {
  const ref = React.useRef<HTMLDivElement>(null)
  const width = useFolderWidth(ref)
  const [projects] = React.useState(readProjects)
  const [articles] = React.useState(readArticles)

  return (
    <div ref={ref} className={cn("tw:flex tw:flex-wrap tw:items-end tw:gap-x-10 tw:gap-y-6", className)}>
      <GlassFolder
        label="Projects"
        tone="dark"
        art="ember"
        seed={7}
        action="more"
        width={width}
        files={projects}
        menu={[
          {
            label: "All repositories on GitHub",
            onSelect: () => window.open("https://github.com/HANSUE1?tab=repositories", "_blank", "noopener"),
          },
        ]}
      />
      <GlassFolder
        label="Writing"
        art="none"
        action="more"
        labelPlacement="top-left"
        width={width}
        appearDelay={140}
        files={articles.files}
        // Opening an article reuses the page's own reader dialog behind its card.
        onFileSelect={(_, index) => articles.cards[index]?.click()}
        menu={[
          {
            label: "Go to Design Thoughts",
            onSelect: () => document.getElementById("thoughts")?.scrollIntoView({ behavior: "smooth" }),
          },
        ]}
      />
      <GlassFolder
        label="Studies"
        art="aurora"
        seed={3}
        action="add"
        width={width}
        appearDelay={280}
        files={[study(1), study(2)]}
        onAdd={(files) => study(files.length + 1)}
      />
    </div>
  )
}
