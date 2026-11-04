import * as React from "react"
import GlassFolder, { type FolderFile } from "@/components/ui/glass-folder-cards"
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

// Printed from tools/resume/ by its build.py. Without an image, a file is drawn as a sheet of paper.
const DOCUMENTS = [
  { name: "Resume", meta: "PDF · 1 page", url: "files/Hans-Santos-Resume.pdf" },
  { name: "CV", meta: "PDF · 2 pages", url: "files/Hans-Santos-CV.pdf" },
]
const documentFiles: FolderFile[] = DOCUMENTS.map(({ name, meta }) => ({ name, meta }))
const openDocument = (url: string) => window.open(url, "_blank", "noopener")

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
        label="Resume & CV"
        art="aurora"
        seed={3}
        action="more"
        width={width}
        appearDelay={280}
        files={documentFiles}
        // Opens in a new tab, so reading a PDF never takes anyone off the site.
        onFileSelect={(_, index) => openDocument(DOCUMENTS[index].url)}
        menu={DOCUMENTS.map(({ name, url }) => ({ label: `Open ${name}`, onSelect: () => openDocument(url) }))}
      />
    </div>
  )
}
