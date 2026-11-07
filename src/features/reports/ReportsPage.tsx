import { BarChart3, Download, FileSpreadsheet, Printer } from 'lucide-react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from 'recharts'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { Select } from '@/components/ui/Field'
import { ChartSkeleton, TableSkeleton } from '@/components/ui/Skeleton'
import { PageHeader } from '@/components/shared/PageHeader'
import { ChartBox, ChartLegend, ChartTooltip, axisProps, gridProps } from '@/components/shared/ChartParts'
import { useAsync } from '@/hooks/useAsync'
import { academicService } from '@/services/academicService'
import { REPORTS, reportService, type ReportId } from '@/services/reportService'
import { downloadCsv } from '@/utils/export'
import { money } from '@/utils/format'
import { notify } from '@/utils/toast'
import { cx } from '@/utils/cn'

const COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)']

function ReportCenter({ group, title, description }: { group: 'academico' | 'economico'; title: string; description: string }) {
  const list = REPORTS.filter((r) => r.group === group)
  const [id, setId] = useState<ReportId>(list[0].id)
  const [yearId, setYearId] = useState('ay-2026')
  const [levelId, setLevelId] = useState<'' | 'primaria' | 'secundaria'>('')
  const years = useAsync(() => academicService.years(), [])
  const rep = useAsync(() => reportService.run(id, { yearId, levelId }), [id, yearId, levelId])
  const r = rep.data
  const fmt = (c: { money?: boolean }, v: string | number) => (c.money ? money(Number(v)) : typeof v === 'number' ? v.toLocaleString('es-PE') : v)

  const exportCsv = () => { if (!r) return; downloadCsv(r.title, r.columns.map((c) => c.label), r.rows.map((row) => r.columns.map((c) => row[c.key]))); notify.success('Reporte exportado', 'CSV listo para Excel') }

  return (
    <>
      <PageHeader eyebrow="Reportes" title={title} description={description}
        actions={<><Button variant="secondary" icon={<Printer />} onClick={() => window.print()} disabled={!r}>Imprimir / PDF</Button><Button icon={<Download />} onClick={exportCsv} disabled={!r?.rows.length}>Exportar CSV</Button></>} />
      <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
        <nav aria-label="Reportes disponibles" className="no-print space-y-1.5">
          {list.map((x) => (
            <button key={x.id} onClick={() => setId(x.id)} aria-current={x.id === id} className={cx('relative w-full rounded-xl border p-3 text-left transition-all', x.id === id ? 'border-primary/40 bg-primary-soft' : 'border-line bg-surface hover:border-line-strong hover:bg-surface-2')}>
              {x.id === id && <motion.span layoutId="rep-bar" className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-primary" />}
              <p className={cx('text-[13px] font-semibold', x.id === id ? 'text-primary' : 'text-ink')}>{x.title}</p><p className="mt-0.5 text-xs text-muted">{x.description}</p>
            </button>))}
        </nav>
        <div className="min-w-0 space-y-4">
          <Card className="no-print flex flex-wrap items-end gap-3 p-4">
            <Select label="Año académico" value={yearId} onChange={(e) => setYearId(e.target.value)} options={years.data?.map((y) => ({ value: y.id, label: String(y.year) })) ?? []} className="w-40" />
            <Select label="Nivel" value={levelId} onChange={(e) => setLevelId(e.target.value as '' | 'primaria' | 'secundaria')} placeholder="Todos" options={[{ value: 'primaria', label: 'Primaria' }, { value: 'secundaria', label: 'Secundaria' }]} className="w-40" />
            <p className="ml-auto flex items-center gap-1.5 pb-2 text-xs text-muted"><FileSpreadsheet className="size-4" />Calculado desde los datos del sistema</p>
          </Card>
          {rep.error ? <Card><ErrorState message={rep.error} onRetry={rep.reload} /></Card> : !r ? <Card><ChartSkeleton className="h-64" /><TableSkeleton rows={5} cols={4} /></Card> : (
            <AnimatePresence mode="wait"><motion.div key={id + yearId + levelId} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={cx('space-y-4', rep.loading && 'opacity-60')}>
              {r.chart && r.rows.length > 0 && (
                <Card><CardHeader title={r.title} action={<ChartLegend items={r.chart.series.map((s, i) => ({ label: s.label, color: COLORS[i % COLORS.length] }))} />} />
                  <ChartBox h={280}><ResponsiveContainer>
                    {r.chart.type === 'pie' ? (
                      <PieChart><Pie data={r.rows} dataKey={r.chart.series[0].key} nameKey={r.chart.x} innerRadius={64} outerRadius={104} paddingAngle={3} cornerRadius={6} stroke="none">{r.rows.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><RTooltip content={<ChartTooltip fmt={money} />} /></PieChart>
                    ) : (
                      <BarChart data={r.rows} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}><CartesianGrid {...gridProps} /><XAxis dataKey={r.chart.x} {...axisProps} interval={0} tick={{ fill: 'var(--muted)', fontSize: 11 }} /><YAxis {...axisProps} width={56} />
                        <RTooltip content={<ChartTooltip fmt={(n) => (r.columns.find((c) => c.key === r.chart!.series[0].key)?.money ? money(n) : n.toLocaleString('es-PE'))} />} cursor={{ fill: 'var(--surface-3)' }} />
                        {r.chart.series.map((s, i) => <Bar key={s.key} dataKey={s.key} name={s.label} fill={COLORS[i % COLORS.length]} radius={[5, 5, 0, 0]} stackId={r.chart!.series.length > 1 && ['seccion'].includes(r.chart!.x) ? 'a' : undefined} animationDuration={800} />)}
                      </BarChart>)}
                  </ResponsiveContainer></ChartBox></Card>)}
              <Card className="overflow-hidden"><CardHeader title={r.title} description={`${r.rows.length} registros`} action={<BarChart3 className="size-4 text-muted" />} />
                {r.rows.length === 0 ? <EmptyState title="Sin datos" description="El reporte no devolvió registros con estos filtros." /> : (
                  <div className="max-h-[520px] overflow-auto"><table className="w-full min-w-max text-[13px]">
                    <thead className="sticky top-0 bg-surface-2 text-[11.5px] uppercase tracking-wider text-muted"><tr>{r.columns.map((c) => <th key={c.key} className={cx('px-4 py-3 font-semibold', c.align === 'right' ? 'text-right' : 'text-left')}>{c.label}</th>)}</tr></thead>
                    <tbody className="divide-y divide-line">{r.rows.map((row, i) => <tr key={i} className="hover:bg-primary-soft/30">{r.columns.map((c) => <td key={c.key} className={cx('px-4 py-2.5', c.align === 'right' && 'text-right tabular')}>{fmt(c, row[c.key])}</td>)}</tr>)}</tbody>
                    {r.totals && <tfoot><tr className="border-t-2 border-line-strong bg-surface-2 font-semibold">{r.columns.map((c, i) => <td key={c.key} className={cx('px-4 py-3', c.align === 'right' && 'text-right tabular')}>{i === 0 ? 'Total' : r.totals![c.key] !== undefined ? fmt(c, r.totals![c.key]) : ''}</td>)}</tr></tfoot>}
                  </table></div>)}</Card>
            </motion.div></AnimatePresence>)}
        </div>
      </div>
    </>
  )
}

export const AcademicReports = () => <ReportCenter group="academico" title="Reportes académicos" description="Estudiantes, matrículas, retiros e historial calculados en vivo." />
export const EconomicReports = () => <ReportCenter group="economico" title="Reportes económicos" description="Ingresos, recaudación, pendientes y morosidad con visualizaciones dinámicas." />
