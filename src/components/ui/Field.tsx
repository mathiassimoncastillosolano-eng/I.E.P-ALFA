import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { AlertCircle, ChevronDown, Search, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { cx } from '@/utils/cn'

const base = 'w-full rounded-[10px] border bg-surface px-3 text-sm text-ink placeholder:text-muted transition-all duration-150 focus:outline-none focus:ring-4 focus:ring-primary/15 focus:border-primary disabled:cursor-not-allowed disabled:bg-surface-3 disabled:opacity-70'

export function FieldShell({ label, error, hint, required, children, className, htmlFor }: { label?: string; error?: string; hint?: string; required?: boolean; children: ReactNode; className?: string; htmlFor?: string }) {
  return (
    <div className={cx('flex flex-col gap-1.5', className)}>
      {label && <label htmlFor={htmlFor} className="text-[13px] font-medium text-ink-2">{label}{required && <span className="ml-0.5 text-danger">*</span>}</label>}
      {children}
      <AnimatePresence initial={false} mode="wait">
        {error ? (
          <motion.p key="e" initial={{ opacity: 0, y: -4, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex items-center gap-1 text-xs text-danger" role="alert">
            <AlertCircle className="size-3.5" />{error}
          </motion.p>
        ) : hint ? <p className="text-xs text-muted">{hint}</p> : null}
      </AnimatePresence>
    </div>
  )
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> { label?: string; error?: string; hint?: string; leading?: ReactNode }
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ label, error, hint, leading, className, required, id, ...rest }, ref) {
  const uid = useId(); const iid = id ?? uid
  return (
    <FieldShell label={label} error={error} hint={hint} required={required} htmlFor={iid} className={className}>
      <div className="relative">
        {leading && <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted [&>svg]:size-4">{leading}</span>}
        <input ref={ref} id={iid} aria-invalid={!!error} className={cx(base, 'h-10', leading && 'pl-9', error ? 'border-danger focus:border-danger focus:ring-danger/15' : 'border-line-strong')} {...rest} />
      </div>
    </FieldShell>
  )
})

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> { label?: string; error?: string; hint?: string; options?: { value: string; label: string; disabled?: boolean }[]; placeholder?: string }
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select({ label, error, hint, options, placeholder, className, required, id, children, ...rest }, ref) {
  const uid = useId(); const iid = id ?? uid
  return (
    <FieldShell label={label} error={error} hint={hint} required={required} htmlFor={iid} className={className}>
      <div className="relative">
        <select ref={ref} id={iid} aria-invalid={!!error} className={cx(base, 'h-10 appearance-none pr-9', error ? 'border-danger' : 'border-line-strong')} {...rest}>
          {placeholder !== undefined && <option value="">{placeholder}</option>}
          {options?.map((o) => <option key={o.value} value={o.value} disabled={o.disabled}>{o.label}</option>)}
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
      </div>
    </FieldShell>
  )
})

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> { label?: string; error?: string; hint?: string }
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea({ label, error, hint, className, required, id, ...rest }, ref) {
  const uid = useId(); const iid = id ?? uid
  return (
    <FieldShell label={label} error={error} hint={hint} required={required} htmlFor={iid} className={className}>
      <textarea ref={ref} id={iid} rows={3} className={cx(base, 'resize-none py-2.5', error ? 'border-danger' : 'border-line-strong')} {...rest} />
    </FieldShell>
  )
})

export function SearchInput({ value, onChange, placeholder = 'Buscar…', className }: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string }) {
  return (
    <div className={cx('relative', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} className={cx(base, 'h-10 border-line-strong pl-9 pr-9')} />
      {value && (
        <button type="button" onClick={() => onChange('')} aria-label="Limpiar búsqueda" className="absolute right-2 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-muted hover:bg-surface-3 hover:text-ink">
          <X className="size-3.5" />
        </button>
      )}
    </div>
  )
}

/** DatePicker nativo accesible con el mismo lenguaje visual. */
export const DateField = forwardRef<HTMLInputElement, Omit<InputProps, 'type'>>(function DateField(props, ref) {
  return <Input ref={ref} type="date" {...props} />
})
