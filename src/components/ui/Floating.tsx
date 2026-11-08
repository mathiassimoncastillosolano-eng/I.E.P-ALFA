import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { cx } from '@/utils/cn'

interface Pos { left: number; top: number; width: number; maxH: number; up: boolean }

interface Props {
  anchorRef: RefObject<HTMLElement | null>
  open: boolean
  onClose: () => void
  children: ReactNode
  /** 'anchor' = mismo ancho que el campo. */
  width?: 'anchor' | number
  minWidth?: number
  maxHeight?: number
  align?: 'start' | 'end'
  className?: string
  id?: string
  role?: string
  label?: string
}

const GAP = 6
const PAD = 8

/**
 * Panel flotante en portal (z-index 80). Se posiciona respecto al campo, se invierte hacia arriba si no
 * cabe debajo y nunca queda recortado por contenedores con overflow. Dentro de un modal/drawer de Radix
 * se monta dentro del propio diálogo para conservar el foco y los eventos de puntero.
 */
export function FloatingPanel({ anchorRef, open, onClose, children, width = 'anchor', minWidth, maxHeight = 320, align = 'start', className, id, role, label }: Props) {
  const [host, setHost] = useState<HTMLElement | null>(null)
  const [pos, setPos] = useState<Pos | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const probeRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useLayoutEffect(() => {
    if (!open) { setHost(null); setPos(null); return }
    setHost((anchorRef.current?.closest('[role="dialog"]') as HTMLElement | null) ?? document.body)
  }, [open, anchorRef])

  const compute = useCallback(() => {
    const a = anchorRef.current, p = panelRef.current, pr = probeRef.current
    if (!a || !p || !pr) return
    const r = a.getBoundingClientRect()
    const o = pr.getBoundingClientRect()
    const vw = window.innerWidth, vh = window.innerHeight
    const w = Math.min(Math.max(width === 'anchor' ? r.width : width, minWidth ?? 0), vw - PAD * 2)
    p.style.maxHeight = `${maxHeight}px`
    const natural = p.offsetHeight
    const below = vh - r.bottom - GAP - PAD
    const above = r.top - GAP - PAD
    const up = below < Math.min(natural, 220) && above > below
    const maxH = Math.max(120, Math.min(maxHeight, up ? above : below))
    let left = align === 'end' ? r.right - w : r.left
    left = Math.max(PAD, Math.min(left, vw - w - PAD))
    const next: Pos = { left: Math.round(left - o.left), top: Math.round((up ? r.top - GAP : r.bottom + GAP) - o.top), width: Math.round(w), maxH: Math.round(maxH), up }
    setPos((prev) => (prev && prev.left === next.left && prev.top === next.top && prev.width === next.width && prev.maxH === next.maxH && prev.up === next.up ? prev : next))
  }, [anchorRef, width, minWidth, maxHeight, align])

  useLayoutEffect(() => { if (host) compute() }, [host, compute])

  useEffect(() => {
    if (!host) return
    const ro = new ResizeObserver(compute)
    if (panelRef.current) ro.observe(panelRef.current)
    window.addEventListener('resize', compute)
    window.addEventListener('scroll', compute, true)
    return () => { ro.disconnect(); window.removeEventListener('resize', compute); window.removeEventListener('scroll', compute, true) }
  }, [host, compute])

  useEffect(() => {
    if (!open) return
    const down = (e: PointerEvent) => {
      const t = e.target as Node
      if (panelRef.current?.contains(t) || anchorRef.current?.contains(t)) return
      onCloseRef.current()
    }
    // En captura sobre window para cerrar solo el panel (y no el modal que lo contiene) al pulsar Escape.
    const key = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.stopPropagation(); e.preventDefault()
      onCloseRef.current()
      anchorRef.current?.querySelector<HTMLElement>('button')?.focus()
    }
    document.addEventListener('pointerdown', down, true)
    window.addEventListener('keydown', key, true)
    return () => { document.removeEventListener('pointerdown', down, true); window.removeEventListener('keydown', key, true) }
  }, [open, anchorRef])

  if (!open || !host) return null
  return createPortal(
    <>
      <div ref={probeRef} aria-hidden style={{ position: 'fixed', left: 0, top: 0, width: 0, height: 0, pointerEvents: 'none' }} />
      <div
        ref={panelRef} id={id} role={role} aria-label={label}
        style={{ position: 'fixed', zIndex: 80, left: pos?.left ?? 0, top: pos?.top ?? 0, width: pos?.width, maxHeight: pos?.maxH ?? maxHeight, translate: pos?.up ? '0 -100%' : undefined, opacity: pos ? undefined : 0, pointerEvents: pos ? 'auto' : 'none' }}
        className={cx('flex flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-pop', pos && 'animate-pop', pos?.up ? 'origin-bottom' : 'origin-top', className)}
      >{children}</div>
    </>,
    host,
  )
}
