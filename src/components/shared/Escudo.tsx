import { useState } from 'react'
import { cx } from '@/utils/cn'

/**
 * Escudo institucional oficial (PNG con transparencia real, sin fondo).
 * `escudo-alfa.png` (447 px) para tamaños grandes y `escudo-alfa-128.png` para iconos pequeños.
 */
export const ESCUDO_SRC = '/logos/escudo-alfa.png'
const ESCUDO_SM = '/logos/escudo-alfa-128.png' // 96 px
const ESCUDO_MD = '/logos/escudo-alfa-192.png'

export function Escudo({ className, size = 40, glow }: { className?: string; size?: number; glow?: boolean }) {
  const [failed, setFailed] = useState(false)
  if (!failed) {
    const img = (
      <img src={size <= 44 ? ESCUDO_SM : size <= 96 ? ESCUDO_MD : ESCUDO_SRC} alt="Escudo I.E.P. ALFA" width={size} height={size} decoding="async" draggable={false} onError={() => setFailed(true)}
        className={cx('shrink-0 object-contain drop-shadow-[0_2px_6px_rgba(4,12,40,0.45)] transition-[width,height] duration-200', className)} style={{ width: size, height: size }} />
    )
    if (!glow) return img
    return (
      <span className="relative inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
        <span aria-hidden className="absolute -inset-2 rounded-full bg-[radial-gradient(closest-side,rgba(63,176,230,0.38),transparent)] blur-[2px]" />
        {img}
      </span>
    )
  }
  return (
    <span role="img" aria-label="Escudo I.E.P. ALFA" className={cx('inline-flex shrink-0 items-center justify-center rounded-xl bg-white/10 font-bold tracking-tight text-white', className)} style={{ width: size, height: size, fontSize: size * 0.34 }}>IEP</span>
  )
}
