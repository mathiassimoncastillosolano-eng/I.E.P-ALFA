import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { cx } from '@/utils/cn'
import { AnimatedNumber } from './AnimatedNumber'

export function StatCard({ label, value, format, icon, trend, hint, tone = 'primary', index = 0, onClick }: {
  label: string; value: number; format?: (n: number) => string; icon: ReactNode; trend?: number; hint?: string; tone?: 'primary' | 'accent' | 'danger' | 'success' | 'warning'; index?: number; onClick?: () => void
}) {
  const toneCls = { primary: 'bg-primary-soft text-primary', accent: 'bg-accent-soft text-accent', danger: 'bg-danger-soft text-danger', success: 'bg-success-soft text-success', warning: 'bg-warning-soft text-warning' }[tone]
  const Wrapper = onClick ? motion.button : motion.div
  return (
    <Wrapper onClick={onClick} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={cx('group relative overflow-hidden rounded-[16px] border border-line bg-surface p-4 text-left shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-card focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20', onClick && 'cursor-pointer')}>
      <span aria-hidden className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-primary via-accent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="flex items-start justify-between gap-2">
        <p className="text-[12.5px] font-medium text-muted">{label}</p>
        <span className={cx('flex size-9 items-center justify-center rounded-xl ring-1 ring-inset ring-current/10 transition-transform group-hover:scale-110 [&>svg]:size-4', toneCls)}>{icon}</span>
      </div>
      <p className="mt-2 text-[26px] font-semibold leading-none tracking-tight text-ink"><AnimatedNumber value={value} format={format} /></p>
      <div className="mt-2 flex min-h-5 items-center gap-2 text-xs">
        {trend !== undefined && (
          <span className={cx('inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-semibold', trend >= 0 ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger')}>
            {trend >= 0 ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}{Math.abs(trend).toFixed(1)}%
          </span>
        )}
        {hint && <span className="truncate text-muted">{hint}</span>}
      </div>
    </Wrapper>
  )
}
