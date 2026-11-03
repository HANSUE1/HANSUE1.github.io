// React island for the Archive section: mounts the glass folders into #archive-desk (bundled via src/main.tsx).
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import ArchiveDesk from "@/components/archive-desk"

const root = document.getElementById("archive-desk")
if (root) {
  createRoot(root).render(
    <StrictMode>
      <ArchiveDesk />
    </StrictMode>,
  )
}
