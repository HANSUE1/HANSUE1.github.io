// React island for the portfolio's side menu: mounts SiteMenu into #side-menu (bundled via src/main.tsx).
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import SiteMenu from "@/components/site-menu"

const root = document.getElementById("side-menu")
if (root) {
  createRoot(root).render(
    <StrictMode>
      <SiteMenu />
    </StrictMode>,
  )
}
