import type { HTMLAttributes, ReactNode } from 'react'
import { cx } from '@/utils/cn'

export function Card({ className, hover, ...rest }: HTMLAttributes<HTMLDivElement> & { hover?: boolean }) {
  return <div className={cx('rounded-[14px] border border-line bg-surface shadow-soft', hover && 'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card hover:border-line-strong', className)} {...rest} />
}
export function CardHeader({ title, description, action, className }: { title: ReactNode; description?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cx('flex items-start justify-between gap-3 px-5 pt-4 pb-3', className)}>
      <div className="min-w-0"><h3 className="truncate text-[15px] font-semibold tracking-tight text-ink">{title}</h3>{description && <p className="mt-0.5 text-[13px] text-muted">{description}</p>}</div>
      {action}
    </div>
  )
}
export const SectionTitle = ({ children, icon }: { children: ReactNode; icon?: ReactNode }) => (
  <div className="mb-4 flex items-center gap-2 border-b border-line pb-3 text-[13px] font-semibold uppercase tracking-wider text-ink-2 [&>svg]:size-4 [&>svg]:text-primary">{icon}{children}</div>
)
