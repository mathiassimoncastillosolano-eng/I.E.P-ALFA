import type { ReactNode } from 'react'

export const axisProps = { tick: { fill: 'var(--muted)', fontSize: 12 }, axisLine: false, tickLine: false } as const
export const gridProps = { stroke: 'var(--border)', strokeDasharray: '3 4', vertical: false } as const

interface TipProps { active?: boolean; payload?: { name?: string; value?: number; color?: string; dataKey?: string }[]; label?: string; fmt?: (n: number) => string }
export function ChartTooltip({ active, payload, label, fmt = (n) => n.toLocaleString('es-PE') }: TipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-2 text-xs shadow-pop">
      {label && <p className="mb-1 font-semibold text-ink">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="flex items-center gap-2 text-ink-2"><span className="size-2 rounded-full" style={{ background: p.color }} />{p.name}: <b className="tabular text-ink">{fmt(Number(p.value ?? 0))}</b></p>
      ))}
    </div>
  )
}
export function ChartLegend({ items }: { items: { label: string; color: string }[] }) {
  return <div className="flex flex-wrap gap-x-4 gap-y-1">{items.map((i) => <span key={i.label} className="flex items-center gap-1.5 text-xs text-muted"><span className="size-2 rounded-full" style={{ background: i.color }} />{i.label}</span>)}</div>
}
export const ChartBox = ({ children, h = 260 }: { children: ReactNode; h?: number }) => <div style={{ height: h }} className="w-full px-2 pb-3">{children}</div>
