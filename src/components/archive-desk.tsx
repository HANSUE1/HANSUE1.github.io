import * as React from "react"
import GlassFolder, { type FolderFile } from "@/components/ui/glass-folder-cards"
import { cn } from "@/lib/utils"

// The Projects folder holds what index.html already shows, read from its cards once at mount, so every project is
// written in one place only.
function readProjects(): FolderFile[] {
  return Array.from(document.querySelectorAll<HTMLAnchorElement>(".project-card")).map((card) => ({
    name: card.querySelector("h3")?.textContent ?? "Project",
    meta: card.querySelector(".project-tags li")?.textContent ?? undefined,
    image: card.querySelector(".project-image img")?.getAttribute("src") ?? undefined,
    href: card.href,
  }))
}

// Public work that has no card on the page: coursework and practice.
const LABS = [
  { name: "Digital Forensics Project", meta: "Python", art: "dusk", url: "https://github.com/HANSUE1/LAB-ACT-DF" },
  { name: "Northstar ATM System", meta: "Java", art: "glacier", url: "https://github.com/HANSUE1/Test-Bank-system" },
  { name: "React Fundamentals", meta: "JavaScript", art: "aurora", url: "https://github.com/HANSUE1/React.js-Fundamentals" },
] as const
const labFiles: FolderFile[] = LABS.map(({ name, meta, art }) => ({ name, meta, art }))

// Printed from tools/resume/ by its build.py. Without an image, a file is drawn as a sheet of paper.
const DOCUMENTS = [
  { name: "Resume", meta: "PDF · 1 page", url: "files/Hans-Santos-Resume.pdf" },
  { name: "CV", meta: "PDF · 2 pages", url: "files/Hans-Santos-CV.pdf" },
]
const documentFiles: FolderFile[] = DOCUMENTS.map(({ name, meta }) => ({ name, meta }))
const openInTab = (url: string) => window.open(url, "_blank", "noopener")

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
        label="Labs"
        tone="dark"
        art="verdant"
        seed={11}
        action="more"
        width={width}
        appearDelay={140}
        files={labFiles}
        onFileSelect={(_, index) => openInTab(LABS[index].url)}
        menu={[
          {
            label: "All repositories on GitHub",
            onSelect: () => openInTab("https://github.com/HANSUE1?tab=repositories"),
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
        onFileSelect={(_, index) => openInTab(DOCUMENTS[index].url)}
        menu={DOCUMENTS.map(({ name, url }) => ({ label: `Open ${name}`, onSelect: () => openInTab(url) }))}
      />
    </div>
  )
}
