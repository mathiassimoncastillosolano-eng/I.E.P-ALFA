import { Fragment, forwardRef, useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type FocusEvent, type KeyboardEvent, type ReactNode, type RefObject, type SelectHTMLAttributes } from 'react'
import { Check, ChevronDown, Loader2, Search, X } from 'lucide-react'
import { cx } from '@/utils/cn'
import { FieldShell, fieldBase, fieldBorder, fieldOpen } from './FieldShell'
import { FloatingPanel } from './Floating'
import { commitNativeValue, watchNativeValue } from './nativeValue'

export interface SelectOption { value: string; label: string; disabled?: boolean; description?: string; icon?: ReactNode; group?: string }

const norm = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()

function useOptionFilter(options: SelectOption[], q: string) {
  return useMemo(() => (q.trim() ? options.filter((o) => norm(`${o.label} ${o.description ?? ''} ${o.group ?? ''}`).includes(norm(q.trim()))) : options), [options, q])
}

function stepIndex(list: SelectOption[], from: number, dir: 1 | -1) {
  if (!list.some((o) => !o.disabled)) return -1
  let i = from
  for (let n = 0; n < list.length; n++) { i = (i + dir + list.length) % list.length; if (!list[i].disabled) return i }
  return -1
}

/** Lista de opciones compartida por Select y MultiSelect (agrupación, descripción, icono, estado vacío). */
function Listbox({ id, options, active, isSelected, onPick, onHover, multi, empty = 'Sin coincidencias' }: { id: string; options: SelectOption[]; active: number; isSelected: (v: string) => boolean; onPick: (v: string) => void; onHover: (i: number) => void; multi?: boolean; empty?: string }) {
  let lastGroup: string | undefined
  return (
    <ul id={id} role="listbox" aria-multiselectable={multi || undefined} className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-1.5">
      {options.length === 0 && <li role="presentation" className="px-3 py-6 text-center text-[13px] text-muted">{empty}</li>}
      {options.map((o, i) => {
        const header = o.group && o.group !== lastGroup ? <li role="presentation" className="px-2.5 pb-1 pt-2 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted first:pt-1">{o.group}</li> : null
        lastGroup = o.group
        const sel = isSelected(o.value)
        return (
          <Fragment key={o.value}>
            {header}
            <li id={`${id}-${i}`} role="option" aria-selected={sel} aria-disabled={o.disabled || undefined}
              onMouseDown={(e) => e.preventDefault()} onMouseEnter={() => onHover(i)} onClick={() => { if (!o.disabled) onPick(o.value) }}
              className={cx('flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition-colors [&>svg]:size-4', o.disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer', i === active && !o.disabled && 'bg-surface-3', sel ? 'font-medium text-primary' : 'text-ink', sel && i !== active && 'bg-primary-soft/60')}>
              {o.icon}
              <span className="min-w-0 flex-1"><span className="block truncate">{o.label}</span>{o.description && <span className="block truncate text-xs font-normal text-muted">{o.description}</span>}</span>
              {sel && <Check className="shrink-0 text-primary" aria-hidden />}
            </li>
          </Fragment>
        )
      })}
    </ul>
  )
}

function SearchBox({ inputRef, value, onChange, onKeyDown, controls, activeId }: { inputRef: RefObject<HTMLInputElement | null>; value: string; onChange: (v: string) => void; onKeyDown: (e: KeyboardEvent<HTMLElement>) => void; controls: string; activeId?: string }) {
  return (
    <div className="relative border-b border-line p-1.5">
      <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted" />
      <input ref={inputRef} value={value} onChange={(e) => onChange(e.target.value)} onKeyDown={onKeyDown} role="combobox" aria-expanded aria-controls={controls} aria-activedescendant={activeId} aria-autocomplete="list" aria-label="Buscar opción" placeholder="Buscar…" autoComplete="off"
        className="h-9 w-full rounded-lg bg-surface-2 pl-8 pr-2 text-[13px] text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/25" />
    </div>
  )
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size' | 'children'> {
  label?: string; error?: string; hint?: string
  options?: SelectOption[]
  placeholder?: string
  leading?: ReactNode
  size?: 'sm' | 'md'
  /** 'auto' activa el buscador interno a partir de 8 opciones. */
  searchable?: boolean | 'auto'
  clearable?: boolean
  loading?: boolean
  triggerClassName?: string
}

/**
 * Select personalizado (reemplaza al `<select>` nativo en toda la app). Mantiene la API anterior:
 * `value`/`onChange(e)` controlado o `{...register('campo')}` de react-hook-form.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select({ label, error, hint, options = [], placeholder, leading, size = 'md', searchable = 'auto', clearable, loading, triggerClassName, className, required, id, disabled, value, defaultValue, onChange, onBlur, name, 'aria-label': ariaLabel, ...rest }, ref) {
  const uid = useId()
  const tid = id ?? `${uid}-t`, lid = `${uid}-l`
  const selRef = useRef<HTMLSelectElement | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const typeahead = useRef({ buf: '', t: 0 })
  const controlled = value !== undefined
  const [inner, setInner] = useState(() => String(value ?? defaultValue ?? ''))
  const current = controlled ? String(value) : inner
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [active, setActive] = useState(-1)
  const notify = useRef(setInner)

  const showSearch = searchable === true || (searchable === 'auto' && options.length > 8)
  const visible = useOptionFilter(options, q)
  const selected = options.find((o) => o.value === current)
  const canClear = !!clearable && !!selected && !disabled

  const setRef = useCallback((el: HTMLSelectElement | null) => {
    selRef.current = el
    if (el) watchNativeValue(el, (v) => notify.current(v))
    if (typeof ref === 'function') ref(el); else if (ref) ref.current = el
  }, [ref])

  // Sincroniza el valor "no controlado" (valores por defecto de RHF o del propio DOM).
  useLayoutEffect(() => {
    const v = selRef.current?.value
    if (!controlled && v !== undefined && v !== inner) setInner(v)
  })
  useEffect(() => {
    const form = selRef.current?.form
    if (!form) return
    const h = () => window.setTimeout(() => { if (selRef.current) setInner(selRef.current.value) }, 0)
    form.addEventListener('reset', h)
    return () => form.removeEventListener('reset', h)
  }, [])

  const openMenu = () => {
    if (disabled) return
    const idx = options.findIndex((o) => o.value === current && !o.disabled)
    setQ(''); setActive(idx >= 0 ? idx : stepIndex(options, -1, 1)); setOpen(true)
    if (showSearch) requestAnimationFrame(() => searchRef.current?.focus())
  }
  const close = useCallback(() => { setOpen(false); setQ('') }, [])
  const pick = (v: string) => {
    const el = selRef.current
    if (el) commitNativeValue(el, v, 'change')
    if (!controlled) setInner(v)
    close(); triggerRef.current?.focus()
  }
  const hover = useCallback((i: number) => setActive(i), [])
  const onQuery = (v: string) => { setQ(v); setActive(stepIndex(options.filter((o) => (v.trim() ? norm(`${o.label} ${o.description ?? ''} ${o.group ?? ''}`).includes(norm(v.trim())) : true)), -1, 1)) }

  useEffect(() => { if (open && active >= 0) document.getElementById(`${lid}-${active}`)?.scrollIntoView({ block: 'nearest' }) }, [open, active, lid])

  const onKey = (e: KeyboardEvent<HTMLElement>) => {
    if (disabled) return
    const onTrigger = e.target === triggerRef.current
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); if (!open) openMenu(); else setActive((i) => stepIndex(visible, i, 1)); break
      case 'ArrowUp': e.preventDefault(); if (!open) openMenu(); else setActive((i) => stepIndex(visible, i < 0 ? 0 : i, -1)); break
      case 'Home': if (open) { e.preventDefault(); setActive(stepIndex(visible, -1, 1)) } break
      case 'End': if (open) { e.preventDefault(); setActive(stepIndex(visible, 0, -1)) } break
      case 'Enter': e.preventDefault(); if (!open) openMenu(); else { const o = visible[active]; if (o && !o.disabled) pick(o.value) } break
      case ' ': if (onTrigger) { e.preventDefault(); if (!open) openMenu(); else { const o = visible[active]; if (o && !o.disabled) pick(o.value) } } break
      case 'Tab': if (open) close(); break
      default:
        if (onTrigger && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          const ta = typeahead.current
          window.clearTimeout(ta.t); ta.buf += e.key.toLowerCase(); ta.t = window.setTimeout(() => { ta.buf = '' }, 600)
          const idx = options.findIndex((o) => !o.disabled && norm(o.label).startsWith(norm(ta.buf)))
          if (idx >= 0) { if (!open) openMenu(); setActive(idx) }
        }
    }
  }

  const activeId = open && active >= 0 ? `${lid}-${active}` : undefined
  const blur = (e: FocusEvent<HTMLButtonElement>) => onBlur?.(e as unknown as FocusEvent<HTMLSelectElement>)

  return (
    <FieldShell label={label} error={error} hint={hint} required={required} htmlFor={tid} className={className}>
      <div ref={wrapRef} className="relative">
        <button ref={triggerRef} id={tid} type="button" name={name} role="combobox" aria-haspopup="listbox" aria-expanded={open} aria-controls={open ? lid : undefined} aria-activedescendant={!showSearch ? activeId : undefined} aria-invalid={!!error || undefined} aria-label={ariaLabel} aria-busy={loading || undefined}
          disabled={disabled} onClick={() => (open ? close() : openMenu())} onKeyDown={onKey} onBlur={blur}
          className={cx(fieldBase, 'flex items-center gap-2 px-3 text-left', size === 'sm' ? 'h-8 rounded-lg text-xs' : 'h-10', canClear ? 'pr-16' : 'pr-9', fieldBorder(!!error), open && !error && fieldOpen, triggerClassName)}>
          {leading && <span className="shrink-0 text-muted [&>svg]:size-4">{leading}</span>}
          <span className={cx('min-w-0 flex-1 truncate', !selected && 'text-muted/80')}>{selected ? selected.label : (placeholder ?? '')}</span>
        </button>
        {canClear && (
          <button type="button" aria-label="Limpiar selección" onClick={() => pick('')} className="absolute right-8 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-3 hover:text-ink"><X className="size-3.5" /></button>
        )}
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted">
          {loading ? <Loader2 className="size-4 animate-spin" /> : <ChevronDown className={cx('size-4 transition-transform duration-200', open && 'rotate-180 text-primary')} />}
        </span>
        <select ref={setRef} name={name} tabIndex={-1} aria-hidden="true" disabled={disabled} value={controlled ? String(value) : undefined} defaultValue={controlled ? undefined : defaultValue} onChange={onChange} className="pointer-events-none absolute inset-0 h-full w-full opacity-0" {...rest}>
          {placeholder !== undefined && <option value="">{placeholder}</option>}
          {options.map((o) => <option key={o.value} value={o.value} disabled={o.disabled}>{o.label}</option>)}
        </select>
      </div>
      <FloatingPanel anchorRef={wrapRef} open={open} onClose={close} minWidth={size === 'sm' ? 160 : undefined}>
        {showSearch && <SearchBox inputRef={searchRef} value={q} onChange={onQuery} onKeyDown={onKey} controls={lid} activeId={activeId} />}
        <Listbox id={lid} options={visible} active={active} isSelected={(v) => v === current} onPick={pick} onHover={hover} />
      </FloatingPanel>
    </FieldShell>
  )
})

interface MultiProps {
  label?: string; error?: string; hint?: string; required?: boolean; disabled?: boolean
  options: SelectOption[]
  value: string[]
  onChange: (v: string[]) => void
  placeholder?: string
  searchable?: boolean | 'auto'
  className?: string
  id?: string
  'aria-label'?: string
}

/** Selección múltiple con chips y búsqueda interna. */
export function MultiSelect({ label, error, hint, required, disabled, options, value, onChange, placeholder = 'Seleccione…', searchable = 'auto', className, id, 'aria-label': ariaLabel }: MultiProps) {
  const uid = useId()
  const tid = id ?? `${uid}-t`, lid = `${uid}-l`
  const wrapRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [active, setActive] = useState(-1)
  const showSearch = searchable === true || (searchable === 'auto' && options.length > 8)
  const visible = useOptionFilter(options, q)
  const chips = value.map((v) => options.find((o) => o.value === v)).filter((o): o is SelectOption => !!o)

  const toggle = (v: string) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v])
  const openMenu = () => { if (disabled) return; setQ(''); setActive(stepIndex(options, -1, 1)); setOpen(true); if (showSearch) requestAnimationFrame(() => searchRef.current?.focus()) }
  const close = useCallback(() => { setOpen(false); setQ('') }, [])
  const hover = useCallback((i: number) => setActive(i), [])
  useEffect(() => { if (open && active >= 0) document.getElementById(`${lid}-${active}`)?.scrollIntoView({ block: 'nearest' }) }, [open, active, lid])

  const onKey = (e: KeyboardEvent<HTMLElement>) => {
    if (disabled) return
    const onTrigger = e.target === triggerRef.current
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); if (!open) openMenu(); else setActive((i) => stepIndex(visible, i, 1)); break
      case 'ArrowUp': e.preventDefault(); if (!open) openMenu(); else setActive((i) => stepIndex(visible, i < 0 ? 0 : i, -1)); break
      case 'Enter': e.preventDefault(); if (!open) openMenu(); else { const o = visible[active]; if (o && !o.disabled) toggle(o.value) } break
      case ' ': if (onTrigger) { e.preventDefault(); if (!open) openMenu(); else { const o = visible[active]; if (o && !o.disabled) toggle(o.value) } } break
      case 'Backspace': if (!q && value.length && (onTrigger || e.target === searchRef.current)) onChange(value.slice(0, -1)); break
      case 'Tab': if (open) close(); break
    }
  }
  const activeId = open && active >= 0 ? `${lid}-${active}` : undefined

  return (
    <FieldShell label={label} error={error} hint={hint} required={required} htmlFor={tid} className={className}>
      <div ref={wrapRef} className="relative">
        <button ref={triggerRef} id={tid} type="button" role="combobox" aria-haspopup="listbox" aria-expanded={open} aria-controls={open ? lid : undefined} aria-activedescendant={!showSearch ? activeId : undefined} aria-label={ariaLabel} aria-invalid={!!error || undefined}
          disabled={disabled} onClick={() => (open ? close() : openMenu())} onKeyDown={onKey}
          className={cx(fieldBase, 'flex min-h-10 flex-wrap items-center gap-1.5 py-1.5 pl-3 pr-9 text-left', fieldBorder(!!error), open && !error && fieldOpen)}>
          {chips.length === 0 && <span className="text-muted/80">{placeholder}</span>}
          {chips.map((c) => (
            <span key={c.value} className="inline-flex items-center gap-1 rounded-md bg-primary-soft py-0.5 pl-2 pr-1 text-xs font-medium text-primary">
              {c.label}
              <span role="button" tabIndex={-1} aria-label={`Quitar ${c.label}`} onClick={(e) => { e.stopPropagation(); toggle(c.value) }} className="flex size-4 items-center justify-center rounded hover:bg-primary/15"><X className="size-3" /></span>
            </span>
          ))}
        </button>
        <ChevronDown className={cx('pointer-events-none absolute right-3 top-3 size-4 text-muted transition-transform duration-200', open && 'rotate-180 text-primary')} />
      </div>
      <FloatingPanel anchorRef={wrapRef} open={open} onClose={close}>
        {showSearch && <SearchBox inputRef={searchRef} value={q} onChange={(v) => { setQ(v); setActive(0) }} onKeyDown={onKey} controls={lid} activeId={activeId} />}
        <Listbox id={lid} options={visible} active={active} isSelected={(v) => value.includes(v)} onPick={toggle} onHover={hover} multi />
        {value.length > 0 && <div className="flex items-center justify-between border-t border-line bg-surface-2 px-3 py-2 text-xs text-muted"><span>{value.length} seleccionado{value.length === 1 ? '' : 's'}</span><button type="button" onClick={() => onChange([])} className="font-medium text-primary hover:underline">Limpiar</button></div>}
      </FloatingPanel>
    </FieldShell>
  )
}
