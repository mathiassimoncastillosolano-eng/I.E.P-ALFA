import { FileDown, Printer, Receipt, Search } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { Avatar } from '@/components/ui/Avatar'
import { Badge, ObligationBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Select } from '@/components/ui/Field'
import { Skeleton } from '@/components/ui/Skeleton'
import { SearchInput } from '@/components/ui/Field'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatCard } from '@/components/shared/StatCard'
import { useAsync } from '@/hooks/useAsync'
import { useDebounced } from '@/hooks/useDebounced'
import { academicService } from '@/services/academicService'
import { financialService } from '@/services/financialService'
import { studentService } from '@/services/studentService'
import { OBLIGATION_STATUS_LABEL, PAYMENT_METHOD_LABEL } from '@/constants'
import { downloadCsv } from '@/utils/export'
import { fmtDate, money } from '@/utils/format'
import { notify } from '@/utils/toast'
import { CheckCircle2, CircleDollarSign, Clock, TriangleAlert } from 'lucide-react'
import type { ObligationConcept, ObligationStatus } from '@/types'

function Picker() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const dq = useDebounced(q)
  const res = useAsync(() => (dq.trim() ? studentService.search(dq) : studentService.list({})), [dq])
  return (
    <>
      <PageHeader eyebrow="Gestión económica" title="Estado de cuenta" description="Seleccione un estudiante para ver su situación financiera completa." />
      <Card className="p-5"><SearchInput value={q} onChange={setQ} placeholder="Buscar por nombre, DNI o código…" className="max-w-xl" />
        <ul className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {res.data?.slice(0, 18).map((s) => <li key={s.id}><button onClick={() => navigate(`/economico/estados-cuenta/${s.id}`)} className="flex w-full items-center gap-3 rounded-xl border border-line p-3 text-left transition-all hover:border-primary/40 hover:bg-primary-soft/40"><Avatar name={s.fullName} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{s.fullName}</p><p className="text-xs text-muted">DNI {s.dni} · {s.gradeName ?? 'Sin matrícula'}</p></div>{s.debt > 0 && <Badge tone="danger" dot={false}>S/ {s.debt.toFixed(0)}</Badge>}</button></li>)}
        </ul>
        {res.data?.length === 0 && <EmptyState icon={<Search />} title="Sin resultados" />}
      </Card>
    </>
  )
}

export default function AccountsPage() {
  const { studentId } = useParams()
  if (!studentId) return <Picker />
  return <Account studentId={studentId} />
}

function Account({ studentId }: { studentId: string }) {
  const [yearId, setYearId] = useState('')
  const [concept, setConcept] = useState<ObligationConcept | ''>('')
  const [status, setStatus] = useState<ObligationStatus | ''>('')
  const [period, setPeriod] = useState('')
  const st = useAsync(() => studentService.get(studentId), [studentId])
  const years = useAsync(() => academicService.years(), [])
  const acc = useAsync(() => financialService.studentAccount(studentId, { yearId, concept, status, period }), [studentId, yearId, concept, status, period])
  const all = useAsync(() => financialService.studentAccount(studentId), [studentId])
  const s = st.data?.student
  const periods = [...new Set((all.data?.views ?? []).map((v) => v.period))].filter((p) => p !== 'matricula')

  const exportCsv = () => {
    if (!acc.data || !s) return
    downloadCsv(`estado-cuenta-${s.dni}`, ['Concepto', 'Periodo', 'Vence', 'Importe', 'Pagado', 'Saldo', 'Estado'], acc.data.views.map((v) => [v.label, v.period, v.dueDate, v.amount, v.paid, v.balance, v.status]))
    notify.success('Estado de cuenta exportado', 'Archivo CSV compatible con Excel')
  }

  if (!s) return <Skeleton className="h-96 rounded-[14px]" />
  const sum = acc.data?.summary
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Estado de cuenta" title={s.fullName} description={`DNI ${s.dni} · ${s.gradeName ?? 'Sin matrícula vigente'}`}
        actions={<><Link to="/economico/estados-cuenta"><Button variant="ghost">Cambiar estudiante</Button></Link><Button variant="secondary" icon={<FileDown />} onClick={exportCsv}>Exportar</Button><Button variant="secondary" icon={<Printer />} onClick={() => window.print()}>Imprimir / PDF</Button>
          <Link to={`/economico/pagos?nuevo=1&estudiante=${s.id}`}><Button icon={<Receipt />}>Registrar pago</Button></Link></>} />
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard index={0} label="Total de obligaciones" value={sum?.total ?? 0} format={money} icon={<CircleDollarSign />} />
        <StatCard index={1} label="Total pagado" value={sum?.paid ?? 0} format={money} icon={<CheckCircle2 />} tone="success" />
        <StatCard index={2} label="Saldo pendiente" value={sum?.pending ?? 0} format={money} icon={<Clock />} tone="warning" />
        <StatCard index={3} label="Total vencido" value={sum?.overdue ?? 0} format={money} icon={<TriangleAlert />} tone="danger" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="overflow-hidden lg:col-span-2">
          <CardHeader title="Detalle de obligaciones" action={<div className="no-print flex flex-wrap gap-2">
            <Select aria-label="Año" value={yearId} onChange={(e) => setYearId(e.target.value)} placeholder="Todos los años" options={years.data?.map((y) => ({ value: y.id, label: String(y.year) })) ?? []} className="w-36" />
            <Select aria-label="Concepto" value={concept} onChange={(e) => setConcept(e.target.value as ObligationConcept | '')} placeholder="Concepto" options={[{ value: 'matricula', label: 'Matrícula' }, { value: 'mensualidad', label: 'Mensualidad' }]} className="w-36" />
            <Select aria-label="Periodo" value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="Periodo" options={periods.map((p) => ({ value: p, label: p }))} className="w-32" />
            <Select aria-label="Estado" value={status} onChange={(e) => setStatus(e.target.value as ObligationStatus | '')} placeholder="Estado" options={Object.entries(OBLIGATION_STATUS_LABEL).map(([value, label]) => ({ value, label }))} className="w-36" /></div>} />
          <div className="overflow-x-auto">{acc.data?.views.length ? (
            <table className="w-full min-w-max text-[13px]"><thead className="bg-surface-2 text-[11.5px] uppercase tracking-wider text-muted"><tr>{['Concepto', 'Vence', 'Importe', 'Pagado', 'Saldo', 'Estado'].map((h, i) => <th key={h} className={`px-4 py-3 font-semibold ${i >= 2 && i <= 4 ? 'text-right' : 'text-left'}`}>{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-line">{acc.data.views.map((v, i) => (
                <motion.tr key={v.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i, 12) * 0.02 }} className="hover:bg-primary-soft/30"><td className="px-4 py-2.5 font-medium">{v.label}</td><td className="px-4 py-2.5">{fmtDate(v.dueDate)}</td><td className="px-4 py-2.5 text-right tabular">{money(v.amount)}</td><td className="px-4 py-2.5 text-right tabular">{money(v.paid)}</td><td className="px-4 py-2.5 text-right font-semibold tabular">{money(v.balance)}</td>
                  <td className="px-4 py-2.5"><div className="flex items-center gap-1.5"><ObligationBadge status={v.status} />{v.overdue && v.status === 'parcial' && <Badge tone="danger" dot={false}>Vencida</Badge>}</div></td></motion.tr>))}</tbody></table>
          ) : <EmptyState title="Sin obligaciones" description="No hay obligaciones con estos filtros." />}</div>
        </Card>
        <div className="space-y-4">
          <Card><CardHeader title="Próximos vencimientos" /><ul className="space-y-2 px-5 pb-5">{sum?.upcoming.length ? sum.upcoming.map((u) => <li key={u.id} className="flex items-center justify-between rounded-lg bg-surface-2 px-3 py-2 text-[13px]"><span><b className="font-medium">{u.label}</b><br /><span className="text-xs text-muted">{fmtDate(u.dueDate)}</span></span><b className="tabular">{money(u.balance)}</b></li>) : <p className="text-sm text-muted">Sin vencimientos próximos.</p>}</ul></Card>
          <Card><CardHeader title="Historial de pagos" /><ul className="divide-y divide-line px-5 pb-3">{acc.data?.payments.slice(0, 6).map((p) => <li key={p.id} className="py-2.5 text-[13px]"><div className="flex justify-between"><span className="font-mono text-xs">{p.code}</span><b className="tabular">{money(p.total)}</b></div><p className="text-xs text-muted">{fmtDate(p.date)} · {PAYMENT_METHOD_LABEL[p.method]}</p></li>)}{!acc.data?.payments.length && <p className="py-3 text-sm text-muted">Sin pagos.</p>}</ul></Card>
          {!!acc.data?.voided.length && <Card><CardHeader title="Historial de anulaciones" /><ul className="divide-y divide-line px-5 pb-3">{acc.data.voided.map((p) => <li key={p.id} className="py-2.5 text-[13px]"><div className="flex justify-between"><span className="font-mono text-xs">{p.code}</span><b className="tabular text-danger line-through">{money(p.total)}</b></div><p className="text-xs text-muted">{p.voidReason}</p></li>)}</ul></Card>}
        </div>
      </div>
    </div>
  )
}
