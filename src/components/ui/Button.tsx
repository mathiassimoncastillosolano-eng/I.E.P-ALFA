import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { cx } from '@/utils/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'subtle'
type Size = 'sm' | 'md' | 'lg'

const variants: Record<Variant, string> = {
  primary: 'bg-primary text-primary-fg shadow-soft hover:brightness-110 active:brightness-95',
  secondary: 'bg-surface text-ink border border-line-strong hover:bg-surface-2 hover:border-muted/60',
  ghost: 'text-ink-2 hover:bg-surface-3 hover:text-ink',
  subtle: 'bg-primary-soft text-primary hover:brightness-95',
  danger: 'bg-danger text-white shadow-soft hover:brightness-110 active:brightness-95',
}
const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5 rounded-md',
  md: 'h-9 px-3.5 text-sm gap-2 rounded-[10px]',
  lg: 'h-11 px-5 text-sm gap-2 rounded-[12px]',
}

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: ReactNode
  iconRight?: ReactNode
}

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = 'primary', size = 'md', loading, icon, iconRight, className, children, disabled, type = 'button', ...rest }, ref,
) {
  return (
    <button
      ref={ref} type={type} disabled={disabled || loading}
      className={cx('group inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap font-medium transition-all duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50', variants[variant], sizes[size], className)}
      {...rest}
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : icon && <span className="transition-transform group-hover:scale-110 [&>svg]:size-4">{icon}</span>}
      {children}
      {iconRight && <span className="transition-transform group-hover:translate-x-0.5 [&>svg]:size-4">{iconRight}</span>}
    </button>
  )
})

export const IconButton = forwardRef<HTMLButtonElement, Omit<Props, 'icon' | 'iconRight' | 'size'> & { label: string; size?: 'sm' | 'md' }>(function IconButton(
  { label, variant = 'ghost', size = 'md', className, children, ...rest }, ref,
) {
  return (
    <button
      ref={ref} type="button" aria-label={label} title={label}
      className={cx('inline-flex shrink-0 items-center justify-center rounded-[10px] transition-all duration-150 active:scale-95 disabled:opacity-50 [&>svg]:size-4', size === 'sm' ? 'size-8' : 'size-9', variants[variant], className)}
      {...rest}
    >{children}</button>
  )
})
