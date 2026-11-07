import type { ColumnDef } from '@tanstack/react-table'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, ObligationBadge } from '@/components/ui/Badge'
import { DataTable } from '@/components/ui/DataTable'
import { SearchInput, Select } from '@/components/ui/Field'
import { Card } from '@/components/ui/Card'
import { FilterPanel } from '@/components/shared/FilterPanel'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatCard } from '@/components/shared/StatCard'
import { useAsync } from '@/hooks/useAsync'
import { useDebounced } from '@/hooks/useDebounced'
import { academicService } from '@/services/academicService'
import { financialService } from '@/services/financialService'
import { studentService } from '@/services/studentService'
import { OBLIGATION_STATUS_LABEL } from '@/constants'
import { fmtDate, money, moneyCompact, fullName } from '@/utils/format'
import { Banknote, CircleDollarSign, Clock, TriangleAlert } from 'lucide-react'
import type { ObligationConcept, ObligationStatus, ObligationView } from '@/types'
import { db } from '@/services/db'

type Row = ObligationView & { studentName: string; gradeName: string }

export default function TuitionPage() {
  const [yearId, setYearId] = useState('ay-2026')
  const [concept, setConcept] = useState<ObligationConcept | ''>('')
  const [status, setStatus] = useState<ObligationStatus | ''>('')
  const [period, setPeriod] = useState('')
  const [q, setQ] = useState('')
  const dq = useDebounced(q)
  const years = useAsync(() => academicService.years(), [])
  const obs = useAsync(async () => {
    const list = await financialService.obligations({ yearId, concept, status, period })
    const d = db()
    return list.map((o): Row => {
      const s = d.students.find((x) => x.id === o.studentId)!
      const e = d.enrollments.find((x) => x.id === o.enrollmentId)!
      return { ...o, studentName: fullName(s), gradeName: d.grades.find((g) => g.id === e.gradeId)!.short }
    })
  }, [yearId, concept, status, period])
  void studentService
  const rows = useMemo(() => (obs.data ?? []).filter((r) => !dq || r.studentName.toLowerCase().includes(dq.toLowerCase())), [obs.data, dq])
  const live = rows.filter((r) => !r.annulled)
  const periods = [...new Set((obs.data ?? []).map((o) => o.period))].filter((p) => p !== 'matricula').sort()

  const columns = useMemo<ColumnDef<Row, unknown>[]>(() => [
    { id: 'st', accessorFn: (r) => r.studentName, header: 'Estudiante', cell: ({ row: { original: r } }) => <Link to={`/economico/estados-cuenta/${r.studentId}`} className="font-medium hover:text-primary">{r.studentName}<span className="block text-xs font-normal text-muted">{r.gradeName}</span></Link> },
    { accessorKey: 'label', header: 'Concepto', cell: ({ row: { original: r } }) => <div className="flex items-center gap-2">{r.label}{r.concept === 'matricula' && <Badge tone="primary" dot={false}>Matrícula</Badge>}</div> },
    { accessorKey: 'dueDate', header: 'Vence', cell: (c) => fmtDate(c.getValue() as string) },
    { accessorKey: 'amount', header: 'Original', meta: { align: 'right' }, cell: (c) => money(c.getValue() as number) },
    { accessorKey: 'paid', header: 'Pagado', meta: { align: 'right' }, cell: (c) => money(c.getValue() as number) },
    { accessorKey: 'balance', header: 'Saldo', meta: { align: 'right' }, cell: (c) => <b>{money(c.getValue() as number)}</b> },
    { accessorKey: 'status', header: 'Estado', cell: ({ row: { original: r } }) => <div className="flex items-center gap-1.5"><ObligationBadge status={r.status} />{r.overdue && r.status === 'parcial' && <Badge tone="danger" dot={false}>Vencida</Badge>}</div> },
  ], [])

  return (
    <>
      <PageHeader eyebrow="Gestión económica" title="Mensualidades" description="Calendario de obligaciones generadas por las matrículas. Los estados se derivan de pagos y fechas." />
      <div className="mb-5 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard index={0} label="Total programado" value={live.reduce((a, r) => a + r.amount, 0)} format={moneyCompact} icon={<CircleDollarSign />} />
        <StatCard index={1} label="Pagado" value={live.reduce((a, r) => a + r.paid, 0)} format={moneyCompact} icon={<Banknote />} tone="success" />
        <StatCard index={2} label="Saldo pendiente" value={live.reduce((a, r) => a + r.balance, 0)} format={moneyCompact} icon={<Clock />} tone="warning" />
        <StatCard index={3} label="Vencido" value={live.filter((r) => r.overdue).reduce((a, r) => a + r.balance, 0)} format={moneyCompact} icon={<TriangleAlert />} tone="danger" />
      </div>
      <DataTable data={obs.data ? rows : undefined} loading={obs.loading} error={obs.error} onRetry={obs.reload} columns={columns} pageSize={20} resetKey={`${yearId}${concept}${status}${period}${dq}`}
        empty={{ title: 'Sin obligaciones', description: 'No hay obligaciones para los filtros elegidos.' }}
        toolbar={<FilterPanel active={!!(concept || status || period || q)} onClear={() => { setConcept(''); setStatus(''); setPeriod(''); setQ('') }}>
          <SearchInput value={q} onChange={setQ} placeholder="Estudiante…" className="w-full sm:w-60" />
          <Select aria-label="Año" value={yearId} onChange={(e) => setYearId(e.target.value)} options={years.data?.map((y) => ({ value: y.id, label: String(y.year) })) ?? []} className="w-32" />
          <Select aria-label="Concepto" value={concept} onChange={(e) => setConcept(e.target.value as ObligationConcept | '')} placeholder="Concepto" options={[{ value: 'matricula', label: 'Matrícula' }, { value: 'mensualidad', label: 'Mensualidad' }]} className="w-40" />
          <Select aria-label="Periodo" value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="Periodo" options={periods.map((p) => ({ value: p, label: p }))} className="w-36" />
          <Select aria-label="Estado" value={status} onChange={(e) => setStatus(e.target.value as ObligationStatus | '')} placeholder="Estado" options={Object.entries(OBLIGATION_STATUS_LABEL).map(([value, label]) => ({ value, label }))} className="w-40" />
        </FilterPanel>} />
      <Card className="mt-4 p-4 text-xs text-muted">Los importes provienen de la configuración de cada año académico y pueden modificarse en <Link to="/academico/anios" className="font-medium text-primary hover:underline">Años académicos</Link>.</Card>
    </>
  )
}
