// React island for the Archive section: mounts the glass folders into #archive-desk. Built by Vite into
// js/react/archive.js (+ archive.css); the rest of the page stays plain HTML.
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import ArchiveDesk from "@/components/archive-desk"
import "@/styles/globals.css"

const root = document.getElementById("archive-desk")
if (root) {
  createRoot(root).render(
    <StrictMode>
      <ArchiveDesk />
    </StrictMode>,
  )
}
