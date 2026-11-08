import type { ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { cx } from '@/utils/cn'

/** Clases base compartidas por TODOS los controles de formulario (input, select, fecha, textarea). */
export const fieldBase =
  'w-full rounded-[10px] border bg-surface text-sm text-ink placeholder:text-muted/80 transition-[border-color,box-shadow,background-color] duration-150 hover:border-muted/60 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 disabled:cursor-not-allowed disabled:bg-surface-3 disabled:text-muted disabled:hover:border-line-strong'

export const fieldBorder = (error?: boolean) =>
  error ? 'border-danger hover:border-danger focus:border-danger focus:ring-danger/15' : 'border-line-strong'

export const fieldOpen = 'border-primary ring-4 ring-primary/15'

export function FieldShell({ label, error, hint, required, children, className, htmlFor }: { label?: string; error?: string; hint?: string; required?: boolean; children: ReactNode; className?: string; htmlFor?: string }) {
  return (
    <div className={cx('flex flex-col gap-1.5', className)}>
      {label && <label htmlFor={htmlFor} className="text-[13px] font-medium text-ink-2">{label}{required && <span className="ml-0.5 text-danger">*</span>}</label>}
      {children}
      <AnimatePresence initial={false} mode="wait">
        {error ? (
          <motion.p key="e" initial={{ opacity: 0, y: -4, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex items-center gap-1 text-xs text-danger" role="alert">
            <AlertCircle className="size-3.5 shrink-0" />{error}
          </motion.p>
        ) : hint ? <p className="text-xs text-muted">{hint}</p> : null}
      </AnimatePresence>
    </div>
  )
}
