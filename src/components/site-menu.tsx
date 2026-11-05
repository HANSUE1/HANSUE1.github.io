import { useEffect, useState } from "react"
import {
  Archive02Icon,
  Briefcase01Icon,
  DashboardSpeed01Icon,
  Folder01Icon,
  Home01Icon,
  Mail01Icon,
  PencilEdit01Icon,
  Wrench01Icon,
} from "@hugeicons/core-free-icons"
import BranchedMenu, { type BranchedMenuItem } from "@/components/ui/BranchedMenu"

// The portfolio's side menu: every section of the page, in page order, on the React Bits BranchedMenu. Each child's
// value is its section's id. Selection follows the scroll, so a click only moves the page and the line travels with it.
// Layout: .side-menu in css/main.css.
const ITEMS: BranchedMenuItem[] = [
  {
    label: "Start here",
    children: [
      { value: "home", label: "Home", icon: Home01Icon },
      { value: "skills", label: "How I Work", icon: DashboardSpeed01Icon },
    ],
  },
  {
    label: "The work",
    children: [
      { value: "projects", label: "Projects", icon: Folder01Icon },
      { value: "archive", label: "The Archive", icon: Archive02Icon },
      { value: "tools", label: "Tools & Stack", icon: Wrench01Icon },
    ],
  },
  {
    label: "Get to know me",
    children: [
      { value: "experience", label: "Experience", icon: Briefcase01Icon },
      { value: "thoughts", label: "Field Notes", icon: PencilEdit01Icon },
      { value: "contact", label: "Let's Talk", icon: Mail01Icon },
    ],
  },
]

// Same as clicking a link to the section: the page's CSS decides smooth or instant, and the address follows.
const goTo = (id: string) => {
  document.getElementById(id)?.scrollIntoView()
  history.pushState(null, "", `#${id}`)
}

export default function SiteMenu() {
  const [section, setSection] = useState("home")

  // The same band as the top nav's highlight (initNavHighlight in js/main.js).
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) if (entry.isIntersecting) setSection(entry.target.id)
    }, { rootMargin: "-25% 0px -65% 0px" })
    for (const { children } of ITEMS) {
      for (const { value } of children ?? []) {
        const target = document.getElementById(value)
        if (target) observer.observe(target)
      }
    }
    return () => observer.disconnect()
  }, [])

  return (
    <BranchedMenu
      items={ITEMS}
      defaultOpen={[0, 1, 2]}
      activeValue={section}
      onSelect={goTo}
      ariaLabel="Page sections"
      color="#f8f7f7"
      accentColor="#ff6d37"
      lineColor="#393637"
      width={176}
      rowHeight={34}
      indent={38}
      trunk={12}
    />
  )
}
