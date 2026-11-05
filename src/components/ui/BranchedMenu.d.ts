// Types for the JavaScript + CSS variant of React Bits' BranchedMenu (BranchedMenu.jsx), from its props table.
import type { JSX, ReactElement } from "react"
import type { IconSvgElement } from "@hugeicons/react"

export type BranchedMenuChild = {
  value: string
  label: string
  icon?: IconSvgElement | ReactElement
}

export type BranchedMenuItem = {
  label: string
  /** A leaf's value. Sections with children fold instead of selecting. */
  value?: string
  children?: BranchedMenuChild[]
}

export type BranchedMenuProps = {
  items?: BranchedMenuItem[]
  defaultOpen?: number | number[]
  defaultActive?: string
  /** Added for this site: when set, the parent owns the selection (here, the section on screen). */
  activeValue?: string
  onSelect?: (value: string, item: BranchedMenuItem | BranchedMenuChild) => void
  onToggle?: (index: number, open: boolean) => void
  color?: string
  accentColor?: string
  lineColor?: string
  width?: number
  rowHeight?: number
  indent?: number
  trunk?: number
  radius?: number
  lineWidth?: number
  fontSize?: number
  drawDuration?: number
  foldDuration?: number
  className?: string
  /** Added for this site: names the nav landmark, since the page has more than one. */
  ariaLabel?: string
}

declare function BranchedMenu(props: BranchedMenuProps): JSX.Element
export default BranchedMenu
