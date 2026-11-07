import { useState } from 'react'
import { cx } from '@/utils/cn'

/**
 * Escudo institucional. Usa el recurso original `public/logos/escudo-alfa.png` cuando existe.
 * Mientras no se incorpore el archivo oficial se muestra un contenedor neutro con las iniciales
 * (NO es una recreación del escudo).
 */
export const ESCUDO_SRC = '/logos/escudo-alfa.png'

export function Escudo({ className, size = 40 }: { className?: string; size?: number }) {
  const [failed, setFailed] = useState(false)
  if (!failed) return <img src={ESCUDO_SRC} alt="Escudo I.E.P. ALFA" width={size} height={size} onError={() => setFailed(true)} className={cx('shrink-0 object-contain', className)} style={{ width: size, height: size }} />
  return (
    <span aria-label="Escudo I.E.P. ALFA (pendiente de incorporar)" title="Falta incorporar public/logos/escudo-alfa.png"
      className={cx('inline-flex shrink-0 items-center justify-center rounded-xl border border-dashed border-white/40 bg-white/10 font-bold tracking-tight text-white', className)}
      style={{ width: size, height: size, fontSize: size * 0.34 }}>IEP</span>
  )
}
