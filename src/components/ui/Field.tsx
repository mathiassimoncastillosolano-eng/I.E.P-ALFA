import { forwardRef, useId, useState, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react'
import { AlertCircle, Eye, EyeOff, Search, X } from 'lucide-react'
import { cx } from '@/utils/cn'
import { FieldShell, fieldBase, fieldBorder } from './FieldShell'

export { FieldShell, fieldBase, fieldBorder } from './FieldShell'
export { Select, MultiSelect } from './Select'
export type { SelectOption } from './Select'
export { DateField, Calendar } from './DatePicker'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string; error?: string; hint?: string
  /** Icono a la izquierda. */
  leading?: ReactNode
  /** Elemento a la derecha (botón de acción, unidad, etc.). */
  trailing?: ReactNode
  /** Prefijo textual, p. ej. "S/". */
  prefixText?: string
  suffixText?: string
  /** Muestra el contador de caracteres (requiere `maxLength` y `value` controlado). */
  showCount?: boolean
  inputClassName?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ label, error, hint, leading, trailing, prefixText, suffixText, showCount, className, inputClassName, required, id, type, ...rest }, ref) {
  const uid = useId(); const iid = id ?? uid
  const [reveal, setReveal] = useState(false)
  const isPassword = type === 'password'
  const count = showCount && rest.maxLength && typeof rest.value === 'string' ? `${rest.value.length}/${rest.maxLength}` : null
  const hasRight = isPassword || !!trailing || !!suffixText || !!error
  return (
    <FieldShell label={label} error={error} hint={hint} required={required} htmlFor={iid} className={className}>
      <div className="relative">
        {leading && <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted [&>svg]:size-4">{leading}</span>}
        {prefixText && <span className={cx('pointer-events-none absolute inset-y-0 flex items-center text-sm font-medium text-muted', leading ? 'left-9' : 'left-3')}>{prefixText}</span>}
        <input ref={ref} id={iid} type={isPassword && reveal ? 'text' : type} aria-invalid={!!error || undefined} aria-required={required || undefined}
          className={cx(fieldBase, 'h-10 px-3', leading && 'pl-9', prefixText && (leading ? 'pl-[4.25rem]' : 'pl-9'), hasRight && 'pr-10', fieldBorder(!!error), inputClassName)} {...rest} />
        {hasRight && (
          <span className="absolute inset-y-0 right-2 flex items-center gap-1 text-muted">
            {suffixText && <span className="pr-1 text-sm">{suffixText}</span>}
            {trailing}
            {isPassword && (
              <button type="button" onClick={() => setReveal((v) => !v)} aria-label={reveal ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-pressed={reveal} className="flex size-7 items-center justify-center rounded-md transition-colors hover:bg-surface-3 hover:text-ink">{reveal ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button>
            )}
            {error && !isPassword && !trailing && !suffixText && <AlertCircle className="mr-1 size-4 text-danger" aria-hidden />}
          </span>
        )}
      </div>
      {count && <p className="-mt-1 text-right text-[11px] tabular text-muted">{count}</p>}
    </FieldShell>
  )
})

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> { label?: string; error?: string; hint?: string; showCount?: boolean }
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea({ label, error, hint, showCount, className, required, id, ...rest }, ref) {
  const uid = useId(); const iid = id ?? uid
  const count = showCount && rest.maxLength && typeof rest.value === 'string' ? `${rest.value.length}/${rest.maxLength}` : null
  return (
    <FieldShell label={label} error={error} hint={hint} required={required} htmlFor={iid} className={className}>
      <textarea ref={ref} id={iid} rows={3} aria-invalid={!!error || undefined} className={cx(fieldBase, 'resize-none px-3 py-2.5', fieldBorder(!!error))} {...rest} />
      {count && <p className="-mt-1 text-right text-[11px] tabular text-muted">{count}</p>}
    </FieldShell>
  )
})

export function SearchInput({ value, onChange, placeholder = 'Buscar…', className }: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string }) {
  return (
    <div className={cx('relative', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
      <input type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} className={cx(fieldBase, 'h-10 border-line-strong pl-9 pr-9 [&::-webkit-search-cancel-button]:hidden')} />
      {value && (
        <button type="button" onClick={() => onChange('')} aria-label="Limpiar búsqueda" className="absolute right-2 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-3 hover:text-ink">
          <X className="size-3.5" />
        </button>
      )}
    </div>
  )
}
