import { motion } from 'motion/react'
import { useId, type ReactNode } from 'react'
import { cx } from '@/utils/cn'

export function Tabs<T extends string>({ value, onChange, tabs, className }: { value: T; onChange: (v: T) => void; tabs: { id: T; label: string; icon?: ReactNode; count?: number }[]; className?: string }) {
  const id = useId()
  return (
    <div role="tablist" className={cx('flex gap-1 overflow-x-auto border-b border-line', className)}>
      {tabs.map((t) => {
        const active = t.id === value
        return (
          <button key={t.id} role="tab" aria-selected={active} onClick={() => onChange(t.id)}
            className={cx('relative flex shrink-0 items-center gap-2 px-3.5 py-2.5 text-[13px] font-medium transition-colors [&>svg]:size-4', active ? 'text-primary' : 'text-muted hover:text-ink')}>
            {t.icon}{t.label}
            {t.count !== undefined && <span className={cx('rounded-full px-1.5 text-[11px] font-semibold tabular', active ? 'bg-primary-soft text-primary' : 'bg-surface-3 text-muted')}>{t.count}</span>}
            {active && <motion.span layoutId={`tab-${id}`} className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary" transition={{ type: 'spring', stiffness: 500, damping: 40 }} />}
          </button>
        )
      })}
    </div>
  )
}
