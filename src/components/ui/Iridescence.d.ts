// Types for the JavaScript + CSS variant of React Bits' Iridescence (Iridescence.jsx), from its props table.
import type { CSSProperties, JSX } from "react"

export type IridescenceProps = {
  /** Tint multiplied over the colors. Any CSS color, or an RGB array from 0 to 1. */
  color?: string | number[]
  hueShift?: number
  saturation?: number
  brightness?: number
  contrast?: number
  speed?: number
  scale?: number
  detail?: number
  warp?: number
  rotation?: number
  mouseReact?: boolean
  amplitude?: number
  stir?: number
  sheen?: number
  clickSwirl?: boolean
  grain?: number
  fade?: number
  opacity?: number
  resolution?: number
  paused?: boolean
  className?: string
  style?: CSSProperties
}

declare function Iridescence(props: IridescenceProps): JSX.Element
export default Iridescence
