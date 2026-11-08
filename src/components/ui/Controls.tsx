import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react'
import { Check, Minus } from 'lucide-react'
import { cx } from '@/utils/cn'

interface CheckProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> { label?: ReactNode; description?: ReactNode; indeterminate?: boolean }

const box = 'peer sr-only'
const row = 'group inline-flex cursor-pointer items-start gap-2.5 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50'

export const Checkbox = forwardRef<HTMLInputElement, CheckProps>(function Checkbox({ label, description, indeterminate, className, id, ...rest }, ref) {
  const uid = useId(); const iid = id ?? uid
  return (
    <label htmlFor={iid} className={cx(row, className)}>
      <input ref={ref} id={iid} type="checkbox" className={box} aria-checked={indeterminate ? 'mixed' : undefined} {...rest} />
      <span className="mt-px flex size-[18px] shrink-0 items-center justify-center rounded-[6px] border border-line-strong bg-surface text-primary-fg transition-all duration-150 group-hover:border-primary/60 peer-checked:border-primary peer-checked:bg-primary peer-focus-visible:ring-4 peer-focus-visible:ring-primary/20 [&>svg]:size-3 [&>svg]:scale-50 [&>svg]:opacity-0 [&>svg]:transition-all peer-checked:[&>svg]:scale-100 peer-checked:[&>svg]:opacity-100">
        {indeterminate ? <Minus strokeWidth={3} className="!scale-100 !opacity-100" /> : <Check strokeWidth={3} />}
      </span>
      {(label || description) && <span className="text-sm leading-5 text-ink">{label}{description && <span className="block text-xs text-muted">{description}</span>}</span>}
    </label>
  )
})

export const Radio = forwardRef<HTMLInputElement, CheckProps>(function Radio({ label, description, className, id, ...rest }, ref) {
  const uid = useId(); const iid = id ?? uid
  return (
    <label htmlFor={iid} className={cx(row, className)}>
      <input ref={ref} id={iid} type="radio" className={box} {...rest} />
      <span className="mt-px flex size-[18px] shrink-0 items-center justify-center rounded-full border border-line-strong bg-surface transition-all duration-150 group-hover:border-primary/60 peer-checked:border-primary peer-focus-visible:ring-4 peer-focus-visible:ring-primary/20 after:size-2 after:scale-0 after:rounded-full after:bg-primary after:transition-transform peer-checked:after:scale-100" />
      {(label || description) && <span className="text-sm leading-5 text-ink">{label}{description && <span className="block text-xs text-muted">{description}</span>}</span>}
    </label>
  )
})

export const Switch = forwardRef<HTMLInputElement, CheckProps>(function Switch({ label, description, className, id, ...rest }, ref) {
  const uid = useId(); const iid = id ?? uid
  return (
    <label htmlFor={iid} className={cx(row, 'items-center', className)}>
      <input ref={ref} id={iid} type="checkbox" role="switch" className={box} {...rest} />
      <span className="relative h-5 w-9 shrink-0 rounded-full bg-line-strong transition-colors duration-200 peer-checked:bg-primary peer-focus-visible:ring-4 peer-focus-visible:ring-primary/20 after:absolute after:left-0.5 after:top-0.5 after:size-4 after:rounded-full after:bg-white after:shadow-sm after:transition-transform after:duration-200 peer-checked:after:translate-x-4" />
      {(label || description) && <span className="text-sm leading-5 text-ink">{label}{description && <span className="block text-xs text-muted">{description}</span>}</span>}
    </label>
  )
})
