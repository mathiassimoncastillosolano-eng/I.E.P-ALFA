import { cx } from '@/utils/cn'
export const Skeleton = ({ className }: { className?: string }) => <div aria-hidden className={cx('skeleton h-4 w-full', className)} />
export function TableSkeleton({ rows = 8, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div role="status" aria-label="Cargando datos" className="divide-y divide-line">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 px-4 py-3.5">
          <Skeleton className="size-9 shrink-0 rounded-full" />
          {Array.from({ length: cols }).map((__, c) => <Skeleton key={c} className={cx('h-3.5', c === 0 ? 'w-32' : 'flex-1')} />)}
        </div>
      ))}
    </div>
  )
}
export const CardSkeleton = ({ className }: { className?: string }) => (
  <div className={cx('rounded-[14px] border border-line bg-surface p-5', className)}><Skeleton className="mb-3 h-3 w-24" /><Skeleton className="mb-2 h-7 w-32" /><Skeleton className="h-3 w-40" /></div>
)
export const ChartSkeleton = ({ className }: { className?: string }) => (
  <div className={cx('flex h-full min-h-48 items-end gap-2 p-4', className)} aria-hidden>
    {[40, 65, 50, 80, 60, 90, 70, 55].map((h, i) => <div key={i} className="skeleton flex-1" style={{ height: `${h}%` }} />)}
  </div>
)
