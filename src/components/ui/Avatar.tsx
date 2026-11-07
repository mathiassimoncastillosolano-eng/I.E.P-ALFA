import { cx } from '@/utils/cn'
import { initials } from '@/utils/format'

const palette = ['bg-primary-soft text-primary', 'bg-accent-soft text-accent', 'bg-danger-soft text-danger', 'bg-success-soft text-success', 'bg-warning-soft text-warning']
export function Avatar({ name, src, size = 'md', className }: { name: string; src?: string; size?: 'sm' | 'md' | 'lg' | 'xl'; className?: string }) {
  const hue = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % palette.length
  const sz = { sm: 'size-7 text-[11px]', md: 'size-9 text-xs', lg: 'size-12 text-sm', xl: 'size-20 text-xl' }[size]
  if (src) return <img src={src} alt={name} className={cx('shrink-0 rounded-full object-cover ring-2 ring-surface', sz, className)} />
  return <span aria-hidden className={cx('inline-flex shrink-0 items-center justify-center rounded-full font-semibold ring-2 ring-surface', sz, palette[hue], className)}>{initials(name)}</span>
}
