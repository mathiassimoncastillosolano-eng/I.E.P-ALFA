import { forwardRef, useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type FocusEvent, type InputHTMLAttributes, type KeyboardEvent } from 'react'
import { addDays, addMonths, addYears, endOfMonth, format, isAfter, isBefore, isSameDay, isSameMonth, parse, startOfDay, startOfMonth, startOfWeek } from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { cx } from '@/utils/cn'
import { SIM_TODAY } from '@/constants'
import { FieldShell, fieldBase, fieldBorder, fieldOpen } from './FieldShell'
import { FloatingPanel } from './Floating'
import { commitNativeValue, watchNativeValue } from './nativeValue'

const ISO = 'yyyy-MM-dd'
const toDate = (s?: string) => { if (!s) return undefined; const d = parse(s, ISO, new Date()); return Number.isNaN(d.getTime()) ? undefined : d }
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
type View = 'days' | 'months' | 'years'

interface CalendarProps { value?: Date; today: Date; min?: Date; max?: Date; onSelect: (d: Date) => void; onClear?: () => void }

/** Calendario con vistas de días, meses y años; navegación completa por teclado. */
export function Calendar({ value, today, min, max, onSelect, onClear }: CalendarProps) {
  const clamp = (d: Date) => (min && isBefore(d, min) ? min : max && isAfter(d, max) ? max : d)
  const [view, setView] = useState<View>('days')
  const [focusDay, setFocusDay] = useState<Date>(() => clamp(value ?? today))
  const [yearPage, setYearPage] = useState(() => Math.floor((value ?? today).getFullYear() / 12) * 12)
  const gridRef = useRef<HTMLDivElement>(null)
  const wantFocus = useRef(true)
  const uid = useId()

  const month = startOfMonth(focusDay)
  const start = startOfWeek(month, { weekStartsOn: 1 })
  const days = Array.from({ length: 42 }, (_, i) => addDays(start, i))
  const off = (d: Date) => (!!min && isBefore(d, startOfDay(min))) || (!!max && isAfter(d, startOfDay(max)))
  const monthOff = (d: Date) => (!!min && isBefore(endOfMonth(d), startOfDay(min))) || (!!max && isAfter(startOfMonth(d), startOfDay(max)))
  const yearOff = (y: number) => (!!min && y < min.getFullYear()) || (!!max && y > max.getFullYear())

  useEffect(() => {
    if (view !== 'days' || !wantFocus.current) return
    const el = gridRef.current?.querySelector<HTMLElement>(`[data-day="${format(focusDay, ISO)}"]`)
    const t = requestAnimationFrame(() => el?.focus({ preventScroll: true }))
    return () => cancelAnimationFrame(t)
  }, [focusDay, view])

  const move = (d: Date) => { wantFocus.current = true; setFocusDay(clamp(d)) }
  const onGridKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const map: Record<string, Date> = {
      ArrowLeft: addDays(focusDay, -1), ArrowRight: addDays(focusDay, 1), ArrowUp: addDays(focusDay, -7), ArrowDown: addDays(focusDay, 7),
      PageUp: e.shiftKey ? addYears(focusDay, -1) : addMonths(focusDay, -1), PageDown: e.shiftKey ? addYears(focusDay, 1) : addMonths(focusDay, 1),
      Home: startOfWeek(focusDay, { weekStartsOn: 1 }), End: addDays(startOfWeek(focusDay, { weekStartsOn: 1 }), 6),
    }
    if (map[e.key]) { e.preventDefault(); move(map[e.key]) }
  }

  const todayOff = off(today)
  const navBtn = 'flex size-8 items-center justify-center rounded-lg text-ink-2 transition-colors hover:bg-surface-3 hover:text-ink disabled:pointer-events-none disabled:opacity-30'
  const prevOff = view === 'days' ? monthOff(addMonths(month, -1)) : view === 'months' ? yearOff(focusDay.getFullYear() - 1) : yearOff(yearPage - 1)
  const nextOff = view === 'days' ? monthOff(addMonths(month, 1)) : view === 'months' ? yearOff(focusDay.getFullYear() + 1) : yearOff(yearPage + 12)
  const go = (dir: 1 | -1) => {
    wantFocus.current = false
    if (view === 'days') setFocusDay(clamp(addMonths(focusDay, dir)))
    else if (view === 'months') setFocusDay(addYears(focusDay, dir))
    else setYearPage((p) => p + dir * 12)
  }
  const title = view === 'days' ? cap(format(month, 'LLLL yyyy', { locale: es })) : view === 'months' ? String(focusDay.getFullYear()) : `${yearPage} – ${yearPage + 11}`

  return (
    <div className="w-[19.5rem] max-w-full select-none p-3">
      <div className="mb-2 flex items-center justify-between gap-1">
        <button type="button" className={navBtn} onClick={() => go(-1)} disabled={prevOff} aria-label={view === 'days' ? 'Mes anterior' : view === 'months' ? 'Año anterior' : 'Años anteriores'}><ChevronLeft className="size-4" /></button>
        <button type="button" onClick={() => { wantFocus.current = false; if (view === 'days') setView('months'); else if (view === 'months') { setYearPage(Math.floor(focusDay.getFullYear() / 12) * 12); setView('years') } else setView('days') }}
          aria-live="polite" className="rounded-lg px-2.5 py-1.5 text-sm font-semibold tracking-tight text-ink transition-colors hover:bg-surface-3">{title}</button>
        <button type="button" className={navBtn} onClick={() => go(1)} disabled={nextOff} aria-label={view === 'days' ? 'Mes siguiente' : view === 'months' ? 'Año siguiente' : 'Años siguientes'}><ChevronRight className="size-4" /></button>
      </div>

      {view === 'days' && (
        <div ref={gridRef} role="grid" aria-label={title} onKeyDown={onGridKey}>
          <div role="row" className="mb-1 grid grid-cols-7">
            {['lu', 'ma', 'mi', 'ju', 'vi', 'sá', 'do'].map((d) => <span key={d} role="columnheader" className="py-1 text-center text-[11px] font-semibold uppercase tracking-wide text-muted">{d}</span>)}
          </div>
          <div className="grid grid-cols-7 gap-y-0.5">
            {days.map((d) => {
              const sel = !!value && isSameDay(d, value), isToday = isSameDay(d, today), outside = !isSameMonth(d, month), dis = off(d), isFocus = isSameDay(d, focusDay)
              return (
                <button key={d.toISOString()} type="button" role="gridcell" data-day={format(d, ISO)} tabIndex={isFocus ? 0 : -1} disabled={dis} aria-selected={sel} aria-current={isToday ? 'date' : undefined} aria-label={format(d, "EEEE d 'de' MMMM 'de' yyyy", { locale: es })}
                  onClick={() => onSelect(d)} onFocus={() => { wantFocus.current = false; if (!isFocus) setFocusDay(d) }}
                  className={cx('mx-auto flex size-9 items-center justify-center rounded-lg text-[13px] tabular transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-30',
                    sel ? 'bg-primary font-semibold text-primary-fg shadow-soft' : cx('hover:bg-surface-3', outside ? 'text-muted/50' : 'text-ink', isToday && 'font-semibold text-primary ring-1 ring-inset ring-primary/40'))}>
                  {d.getDate()}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {view === 'months' && (
        <div className="grid grid-cols-3 gap-1.5" role="listbox" aria-label="Meses" id={`${uid}-m`}>
          {Array.from({ length: 12 }, (_, i) => {
            const d = new Date(focusDay.getFullYear(), i, 1), sel = !!value && isSameMonth(d, value), dis = monthOff(d)
            return <button key={i} type="button" role="option" aria-selected={sel} disabled={dis} onClick={() => { wantFocus.current = true; setFocusDay(clamp(new Date(focusDay.getFullYear(), i, Math.min(focusDay.getDate(), endOfMonth(d).getDate())))); setView('days') }}
              className={cx('h-10 rounded-lg text-[13px] capitalize transition-colors disabled:pointer-events-none disabled:opacity-30', sel ? 'bg-primary font-semibold text-primary-fg' : 'text-ink hover:bg-surface-3', isSameMonth(d, today) && !sel && 'text-primary ring-1 ring-inset ring-primary/40')}>{format(d, 'LLL', { locale: es })}</button>
          })}
        </div>
      )}

      {view === 'years' && (
        <div className="grid grid-cols-3 gap-1.5" role="listbox" aria-label="Años">
          {Array.from({ length: 12 }, (_, i) => {
            const y = yearPage + i, sel = !!value && value.getFullYear() === y, dis = yearOff(y)
            return <button key={y} type="button" role="option" aria-selected={sel} disabled={dis} onClick={() => { setFocusDay(clamp(new Date(y, focusDay.getMonth(), 1))); setView('months') }}
              className={cx('h-10 rounded-lg text-[13px] tabular transition-colors disabled:pointer-events-none disabled:opacity-30', sel ? 'bg-primary font-semibold text-primary-fg' : 'text-ink hover:bg-surface-3', y === today.getFullYear() && !sel && 'text-primary ring-1 ring-inset ring-primary/40')}>{y}</button>
          })}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between border-t border-line pt-2.5">
        <button type="button" disabled={todayOff} onClick={() => onSelect(today)} className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary-soft disabled:pointer-events-none disabled:opacity-40">Hoy</button>
        {onClear && value && <button type="button" onClick={onClear} className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-surface-3 hover:text-ink">Limpiar</button>}
      </div>
    </div>
  )
}

interface DateFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size' | 'min' | 'max' | 'value' | 'defaultValue'> {
  label?: string; error?: string; hint?: string
  /** Fechas en formato ISO `yyyy-MM-dd`. */
  value?: string; defaultValue?: string; min?: string; max?: string
  clearable?: boolean
  size?: 'sm' | 'md'
  triggerClassName?: string
}

/**
 * Campo de fecha con calendario personalizado (reemplaza a `<input type="date">`). Conserva el valor ISO,
 * por lo que funciona igual con `register()` de react-hook-form o como componente controlado.
 */
export const DateField = forwardRef<HTMLInputElement, DateFieldProps>(function DateField({ label, error, hint, value, defaultValue, min, max, clearable, size = 'md', triggerClassName, className, required, id, disabled, placeholder = 'dd/mm/aaaa', onChange, onBlur, name, 'aria-label': ariaLabel, ...rest }, ref) {
  const uid = useId()
  const tid = id ?? `${uid}-t`, pid = `${uid}-p`
  const inputRef = useRef<HTMLInputElement | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const controlled = value !== undefined
  const [inner, setInner] = useState(() => value ?? defaultValue ?? '')
  const current = controlled ? value : inner
  const [open, setOpen] = useState(false)
  const notify = useRef(setInner)
  const date = toDate(current)

  const setRef = useCallback((el: HTMLInputElement | null) => {
    inputRef.current = el
    if (el) watchNativeValue(el, (v) => notify.current(v))
    if (typeof ref === 'function') ref(el); else if (ref) ref.current = el
  }, [ref])

  useLayoutEffect(() => {
    const v = inputRef.current?.value
    if (!controlled && v !== undefined && v !== inner) setInner(v)
  })
  useEffect(() => {
    const form = inputRef.current?.form
    if (!form) return
    const h = () => window.setTimeout(() => { if (inputRef.current) setInner(inputRef.current.value) }, 0)
    form.addEventListener('reset', h)
    return () => form.removeEventListener('reset', h)
  }, [])

  const close = useCallback(() => setOpen(false), [])
  const commit = (v: string) => {
    if (inputRef.current) commitNativeValue(inputRef.current, v, 'input')
    if (!controlled) setInner(v)
  }
  const onKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(true) }
    if ((e.key === 'Backspace' || e.key === 'Delete') && clearable && current) { e.preventDefault(); commit('') }
  }
  const blur = (e: FocusEvent<HTMLButtonElement>) => onBlur?.(e as unknown as FocusEvent<HTMLInputElement>)
  const today = toDate(SIM_TODAY) ?? new Date()
  const minD = toDate(min), maxD = toDate(max)
  const canClear = !!clearable && !!date && !disabled

  return (
    <FieldShell label={label} error={error} hint={hint} required={required} htmlFor={tid} className={className}>
      <div ref={wrapRef} className="relative">
        <button ref={triggerRef} id={tid} type="button" name={name} aria-haspopup="dialog" aria-expanded={open} aria-controls={open ? pid : undefined} aria-invalid={!!error || undefined} aria-label={ariaLabel}
          disabled={disabled} onClick={() => setOpen((o) => !o)} onKeyDown={onKey} onBlur={blur}
          className={cx(fieldBase, 'flex items-center gap-2 px-3 text-left tabular', size === 'sm' ? 'h-8 rounded-lg text-xs' : 'h-10', canClear && 'pr-9', fieldBorder(!!error), open && !error && fieldOpen, triggerClassName)}>
          <CalendarDays className={cx('size-4 shrink-0 transition-colors', open ? 'text-primary' : 'text-muted')} />
          <span className={cx('min-w-0 flex-1 truncate', !date && 'text-muted/80')}>{date ? format(date, 'dd/MM/yyyy') : placeholder}</span>
        </button>
        {canClear && <button type="button" aria-label="Limpiar fecha" onClick={() => commit('')} className="absolute right-2 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-3 hover:text-ink"><X className="size-3.5" /></button>}
        <input ref={setRef} type="text" name={name} tabIndex={-1} aria-hidden="true" value={controlled ? value : undefined} defaultValue={controlled ? undefined : defaultValue} onChange={onChange} disabled={disabled} className="pointer-events-none absolute inset-0 h-full w-full opacity-0" {...rest} />
      </div>
      <FloatingPanel anchorRef={wrapRef} open={open} onClose={close} width={312} maxHeight={460} id={pid} role="dialog" label={label ?? ariaLabel ?? 'Seleccionar fecha'}>
        <Calendar value={date} today={today} min={minD} max={maxD}
          onSelect={(d) => { commit(format(d, ISO)); close(); triggerRef.current?.focus() }}
          onClear={clearable ? () => { commit(''); close(); triggerRef.current?.focus() } : undefined} />
      </FloatingPanel>
    </FieldShell>
  )
})

