import type { ColumnDef } from '@tanstack/react-table'
import { AlertOctagon, Percent, Receipt, TrendingDown, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Badge, ObligationBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { DataTable } from '@/components/ui/DataTable'
import { SearchInput, Select } from '@/components/ui/Field'
import { Tabs } from '@/components/ui/Tabs'
import { FilterPanel } from '@/components/shared/FilterPanel'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatCard } from '@/components/shared/StatCard'
import { useAsync } from '@/hooks/useAsync'
import { useDebounced } from '@/hooks/useDebounced'
import { academicService } from '@/services/academicService'
import { financialService, type DebtFilters } from '@/services/financialService'
import { downloadCsv } from '@/utils/export'
import { fmtDate, money, moneyCompact } from '@/utils/format'
import { notify } from '@/utils/toast'
import type { DebtRow } from '@/types'

type Mode = NonNullable<DebtFilters['mode']>

export default function DebtsPage() {
  const [sp, setSp] = useSearchParams()
  const mode = ((sp.get('modo') as Mode) || 'todas')
  const [q, setQ] = useState('')
  const [gradeId, setGradeId] = useState('')
  const [period, setPeriod] = useState('')
  const dq = useDebounced(q)
  const grades = useAsync(() => academicService.grades(), [])
  const debts = useAsync(() => financialService.debts({ q: dq, gradeId, period, mode, yearId: 'ay-2026' }), [dq, gradeId, period, mode])
  const all = useAsync(() => financialService.debts({ yearId: 'ay-2026' }), [])
  const periods = [...new Set((all.data?.rows ?? []).map((r) => r.period))].filter((p) => p !== 'matricula').sort()

  const columns = useMemo<ColumnDef<DebtRow, unknown>[]>(() => [
    { id: 'st', accessorFn: (r) => r.studentName, header: 'Estudiante', cell: ({ row: { original: r } }) => <Link to={`/economico/estados-cuenta/${r.studentId}`} className="font-medium hover:text-primary">{r.studentName}<span className="block text-xs font-normal text-muted">DNI {r.studentDni}</span></Link> },
    { id: 'g', accessorFn: (r) => r.gradeName, header: 'Grado / Sec.', cell: ({ row: { original: r } }) => `${r.gradeName.replace(' de ', ' · ')} ${r.sectionName}` },
    { accessorKey: 'label', header: 'Concepto' },
    { accessorKey: 'dueDate', header: 'Vence', cell: ({ row: { original: r } }) => <div>{fmtDate(r.dueDate)}{r.overdue && <span className="block text-xs text-danger">{r.daysOverdue} días de atraso</span>}</div> },
    { accessorKey: 'amount', header: 'Importe', meta: { align: 'right' }, cell: (c) => money(c.getValue() as number) },
    { accessorKey: 'balance', header: 'Saldo', meta: { align: 'right' }, cell: ({ row: { original: r } }) => <b className={r.overdue ? 'text-danger' : ''}>{money(r.balance)}</b> },
    { accessorKey: 'status', header: 'Estado', cell: ({ row: { original: r } }) => <div className="flex items-center gap-1.5"><ObligationBadge status={r.status} />{r.overdue && r.status === 'parcial' && <Badge tone="danger" dot={false}>Vencida</Badge>}</div> },
    { id: 'a', header: '', enableSorting: false, cell: ({ row: { original: r } }) => <Link to={`/economico/estados-cuenta/${r.studentId}`}><Button size="sm" variant="ghost" icon={<Receipt />}>Estado</Button></Link> },
  ], [])
  const d = debts.data
  const setMode = (m: Mode) => { if (m === 'todas') sp.delete('modo'); else sp.set('modo', m); setSp(sp) }

  return (
    <>
      <PageHeader eyebrow="Gestión económica" title="Deudas y pendientes" description="Seguimiento de morosidad al 07 nov 2026 (fecha de demostración)."
        actions={<Button variant="secondary" disabled={!d?.rows.length} onClick={() => { downloadCsv('deudas-iep-alfa', ['Estudiante', 'DNI', 'Grado', 'Sección', 'Concepto', 'Vence', 'Importe', 'Saldo', 'Estado'], d!.rows.map((r) => [r.studentName, r.studentDni, r.gradeName, r.sectionName, r.label, r.dueDate, r.amount, r.balance, r.status])); notify.success('Exportación generada') }}>Exportar CSV</Button>} />
      <div className="mb-5 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard index={0} label="Deuda vencida" value={all.data?.summary.overdue ?? 0} format={moneyCompact} icon={<AlertOctagon />} tone="danger" />
        <StatCard index={1} label="Saldo por cobrar" value={all.data?.summary.pending ?? 0} format={moneyCompact} icon={<TrendingDown />} tone="warning" hint="incluye cuotas futuras" />
        <StatCard index={2} label="Estudiantes morosos" value={all.data?.debtors ?? 0} icon={<Users />} />
        <StatCard index={3} label="Morosidad (monto)" value={all.data?.totalActiveReceivable ?? 0} format={(n) => `${n.toFixed(1)}%`} icon={<Percent />} tone="accent" hint="vencido / exigible" />
      </div>
      <Tabs className="mb-4" value={mode} onChange={setMode} tabs={[{ id: 'todas', label: 'Todas' }, { id: 'vencidas', label: 'Vencidas' }, { id: 'parciales', label: 'Pagos parciales' }, { id: 'proximas', label: 'Próximos vencimientos' }]} />
      <DataTable data={d?.rows} loading={debts.loading} error={debts.error} onRetry={debts.reload} columns={columns} pageSize={20} resetKey={`${dq}${gradeId}${period}${mode}`}
        empty={{ title: 'Sin deudas', description: 'No hay obligaciones pendientes con estos criterios.' }}
        toolbar={<FilterPanel active={!!(q || gradeId || period)} onClear={() => { setQ(''); setGradeId(''); setPeriod('') }}>
          <SearchInput value={q} onChange={setQ} placeholder="Estudiante o DNI…" className="w-full sm:w-64" />
          <Select aria-label="Grado" value={gradeId} onChange={(e) => setGradeId(e.target.value)} placeholder="Todos los grados" options={grades.data?.map((g) => ({ value: g.id, label: g.name })) ?? []} className="w-52" />
          <Select aria-label="Periodo" value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="Todos los periodos" options={periods.map((p) => ({ value: p, label: p }))} className="w-44" />
        </FilterPanel>} />
    </>
  )
}
