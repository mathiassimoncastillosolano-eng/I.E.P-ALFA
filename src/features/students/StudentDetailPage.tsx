import { ArrowLeft, CalendarDays, ClipboardList, CreditCard, FileClock, Mail, MapPin, Pencil, Phone, Receipt, UserRound, UsersRound, GraduationCap } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Avatar } from '@/components/ui/Avatar'
import { EnrollmentBadge, ObligationBadge, StudentBadge, Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { Drawer } from '@/components/ui/Modal'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { Tabs } from '@/components/ui/Tabs'
import { useAsync } from '@/hooks/useAsync'
import { useCan } from '@/hooks/usePermission'
import { auditService } from '@/services/auditService'
import { enrollmentService } from '@/services/enrollmentService'
import { financialService } from '@/services/financialService'
import { studentService } from '@/services/studentService'
import { PAYMENT_METHOD_LABEL, MODULE_LABEL } from '@/constants'
import { fmtDate, fmtDateTime, money } from '@/utils/format'
import { StudentForm } from './StudentForm'
import { motion } from 'motion/react'

type Tab = 'general' | 'matriculas' | 'pagos' | 'cuenta' | 'operaciones'

const Row = ({ icon, label, value }: { icon: ReactNode; label: string; value: ReactNode }) => (
  <div className="flex items-start gap-3 py-2.5"><span className="mt-0.5 text-muted [&>svg]:size-4">{icon}</span><div className="min-w-0"><p className="text-xs text-muted">{label}</p><p className="text-sm font-medium text-ink">{value || '—'}</p></div></div>
)

export default function StudentDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const can = useCan()
  const [tab, setTab] = useState<Tab>('general')
  const [editing, setEditing] = useState(false)
  const st = useAsync(() => studentService.get(id), [id])
  const enr = useAsync(() => enrollmentService.list({ studentId: id }), [id])
  const acc = useAsync(() => financialService.studentAccount(id), [id])
  const ops = useAsync(async () => {
    const s = await studentService.get(id)
    const e = await enrollmentService.list({ studentId: id })
    const a = await financialService.studentAccount(id)
    return auditService.forEntities([s.raw.code, ...e.map((x) => x.code), ...a.payments.map((p) => p.code), ...a.voided.map((p) => p.code)])
  }, [id])

  if (st.error) return <Card><ErrorState message={st.error} onRetry={st.reload} /></Card>
  if (!st.data) return <div className="space-y-4"><Skeleton className="h-44 rounded-[20px]" /><Skeleton className="h-96 rounded-[14px]" /></div>
  const { student: s, raw, guardian: g } = st.data
  const sum = acc.data?.summary
  const current = enr.data?.find((e) => e.status !== 'anulado')
  const age = Math.floor((Date.parse('2026-11-07') - Date.parse(raw.birthDate)) / (365.25 * 864e5))

  return (
    <div className="space-y-6">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-ink"><ArrowLeft className="size-4" />Volver</button>

      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="hero-surface relative overflow-hidden rounded-[20px] p-6 text-white shadow-card sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-12 size-56 rounded-full border border-white/10" />
        <div className="relative flex flex-wrap items-center gap-5">
          <Avatar name={s.fullName} src={s.photo} size="xl" className="!ring-4 !ring-white/20" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2"><span className="font-mono text-xs text-white/60">{s.code}</span><StudentBadge status={s.status} /></div>
            <h1 className="mt-1 text-[28px] font-semibold leading-tight tracking-tight">{s.fullName}</h1>
            <p className="mt-1 text-sm text-white/70">DNI {s.dni} · {age} años · {s.gradeName ? `${s.gradeName} · Sección ${s.sectionName}` : 'Sin matrícula vigente'}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button className="!bg-white !text-[#173d91]" icon={<Pencil />} disabled={!can('students.write')} onClick={() => setEditing(true)}>Editar</Button>
            <Link to={`/academico/matriculas/nueva?estudiante=${s.id}`}><Button variant="ghost" className="!text-white ring-1 ring-white/30 hover:!bg-white/10" icon={<ClipboardList />}>Matricular</Button></Link>
          </div>
        </div>
        <div className="relative mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[['Total de obligaciones', sum ? money(sum.total) : '…'], ['Total pagado', sum ? money(sum.paid) : '…'], ['Saldo pendiente', sum ? money(sum.pending) : '…'], ['Vencido', sum ? money(sum.overdue) : '…']].map(([l, v]) => (
            <div key={l} className="rounded-xl bg-white/10 px-4 py-3 ring-1 ring-white/10 backdrop-blur-sm"><p className="text-xs text-white/60">{l}</p><p className="mt-0.5 text-lg font-semibold tabular">{v}</p></div>
          ))}
        </div>
      </motion.section>

      <Tabs value={tab} onChange={setTab} tabs={[
        { id: 'general', label: 'Información general', icon: <UserRound /> },
        { id: 'matriculas', label: 'Matrículas', icon: <GraduationCap />, count: enr.data?.length },
        { id: 'pagos', label: 'Pagos', icon: <CreditCard />, count: acc.data?.payments.length },
        { id: 'cuenta', label: 'Estado de cuenta', icon: <Receipt /> },
        { id: 'operaciones', label: 'Operaciones', icon: <FileClock />, count: ops.data?.length },
      ]} />

      <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        {tab === 'general' && (
          <div className="grid gap-4 lg:grid-cols-2">
            <Card><CardHeader title="Datos personales" /><div className="divide-y divide-line px-5 pb-3">
              <Row icon={<CalendarDays />} label="Fecha de nacimiento" value={fmtDate(raw.birthDate)} /><Row icon={<UserRound />} label="Sexo" value={raw.sex === 'M' ? 'Masculino' : 'Femenino'} />
              <Row icon={<MapPin />} label="Dirección" value={raw.address} /><Row icon={<Phone />} label="Teléfono" value={raw.phone} /><Row icon={<Mail />} label="Correo" value={raw.email} />
              <Row icon={<ClipboardList />} label="Observaciones" value={raw.notes} /></div></Card>
            <Card><CardHeader title="Apoderado principal" description={g.relationship} /><div className="divide-y divide-line px-5 pb-3">
              <Row icon={<UsersRound />} label="Nombre completo" value={`${g.names} ${g.surnames}`} /><Row icon={<UserRound />} label="DNI" value={g.dni} />
              <Row icon={<Phone />} label="Teléfono" value={g.phone} /><Row icon={<Mail />} label="Correo" value={g.email} /><Row icon={<MapPin />} label="Dirección" value={g.address} /></div></Card>
            {current && <Card className="lg:col-span-2"><CardHeader title="Matrícula actual" action={<Link className="text-xs font-medium text-primary hover:underline" to={`/academico/matriculas/${current.id}`}>Ver detalle</Link>} />
              <div className="grid gap-4 px-5 pb-5 sm:grid-cols-4"><div><p className="text-xs text-muted">Código</p><p className="font-mono text-sm font-medium">{current.code}</p></div><div><p className="text-xs text-muted">Año</p><p className="text-sm font-medium">{current.year}</p></div><div><p className="text-xs text-muted">Grado / Sección</p><p className="text-sm font-medium">{current.gradeName} · {current.sectionName}</p></div><div><p className="text-xs text-muted">Estado</p><EnrollmentBadge status={current.status} /></div></div></Card>}
          </div>
        )}
        {tab === 'matriculas' && (
          <Card>{enr.data?.length ? (
            <ol className="relative space-y-0 px-6 py-5">
              {enr.data.map((e, i) => (
                <li key={e.id} className="relative flex gap-4 pb-6 last:pb-0">
                  {i < enr.data!.length - 1 && <span className="absolute left-[15px] top-8 h-full w-px bg-line" />}
                  <span className="z-10 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary">{e.year % 100}</span>
                  <Link to={`/academico/matriculas/${e.id}`} className="flex-1 rounded-xl border border-line p-4 transition-colors hover:border-primary/40 hover:bg-primary-soft/30">
                    <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-medium">{e.year}: {e.gradeName} · Sección {e.sectionName}</p><EnrollmentBadge status={e.status} /></div>
                    <p className="mt-1 text-xs text-muted">{e.code} · Matriculado el {fmtDate(e.enrolledAt)} · Pagado {money(e.paid)} de {money(e.total)}</p>
                  </Link>
                </li>
              ))}
            </ol>) : <EmptyState title="Sin matrículas" description="Este estudiante aún no tiene matrículas registradas." />}</Card>
        )}
        {tab === 'pagos' && (
          <Card className="overflow-x-auto">{acc.data && (acc.data.payments.length + acc.data.voided.length) ? (
            <table className="w-full min-w-max text-[13px]"><thead className="bg-surface-2 text-[11.5px] uppercase tracking-wider text-muted"><tr>{['Comprobante', 'Fecha', 'Método', 'Detalle', 'Importe', 'Estado'].map((h) => <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-line">{[...acc.data.payments, ...acc.data.voided].sort((a, b) => b.date.localeCompare(a.date)).map((p) => (
                <tr key={p.id} className="hover:bg-primary-soft/30"><td className="px-4 py-3 font-mono text-xs">{p.code}</td><td className="px-4 py-3">{fmtDate(p.date)}</td><td className="px-4 py-3">{PAYMENT_METHOD_LABEL[p.method]}</td>
                  <td className="px-4 py-3 text-muted">{p.details.map((d) => d.label).join(', ')}</td><td className="px-4 py-3 font-semibold tabular">{money(p.total)}</td>
                  <td className="px-4 py-3">{p.status === 'anulado' ? <Badge tone="danger">Anulado</Badge> : <Badge tone="success">Confirmado</Badge>}</td></tr>))}</tbody></table>
          ) : <EmptyState title="Sin pagos registrados" />}</Card>
        )}
        {tab === 'cuenta' && (
          <Card className="overflow-x-auto"><CardHeader title="Obligaciones económicas" action={<Link to={`/economico/estados-cuenta/${s.id}`}><Button size="sm" variant="secondary" icon={<Receipt />}>Estado de cuenta completo</Button></Link>} />
            {acc.data?.views.length ? (
              <table className="w-full min-w-max text-[13px]"><thead className="bg-surface-2 text-[11.5px] uppercase tracking-wider text-muted"><tr>{['Concepto', 'Vence', 'Importe', 'Pagado', 'Saldo', 'Estado'].map((h) => <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-line">{acc.data.views.map((v) => (<tr key={v.id} className="hover:bg-primary-soft/30"><td className="px-4 py-2.5 font-medium">{v.label}</td><td className="px-4 py-2.5">{fmtDate(v.dueDate)}</td><td className="px-4 py-2.5 tabular">{money(v.amount)}</td><td className="px-4 py-2.5 tabular">{money(v.paid)}</td><td className="px-4 py-2.5 font-semibold tabular">{money(v.balance)}</td><td className="px-4 py-2.5"><ObligationBadge status={v.status} /></td></tr>))}</tbody></table>
            ) : <EmptyState title="Sin obligaciones" />}</Card>
        )}
        {tab === 'operaciones' && (
          <Card><ul className="divide-y divide-line">{ops.data?.map((a) => (
            <li key={a.id} className="flex gap-4 px-5 py-3.5"><span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" /><div className="min-w-0 flex-1"><p className="text-[13px] font-medium">{a.description}</p><p className="text-xs text-muted">{a.userName} · {fmtDateTime(a.at)}</p></div><Badge tone="primary" dot={false}>{MODULE_LABEL[a.module]}</Badge></li>))}
            {!ops.data?.length && <EmptyState title="Sin operaciones registradas" />}</ul></Card>
        )}
      </motion.div>

      <Drawer open={editing} onOpenChange={setEditing} width="max-w-3xl" title="Editar estudiante" description={s.fullName}
        footer={<><Button variant="ghost" onClick={() => setEditing(false)}>Cancelar</Button><Button type="submit" form="student-form">Guardar cambios</Button></>}>
        <StudentForm editingId={s.id} hideActions onSaved={() => setEditing(false)} initial={{ dni: raw.dni, names: raw.names, paternalSurname: raw.paternalSurname, maternalSurname: raw.maternalSurname, birthDate: raw.birthDate, sex: raw.sex, address: raw.address, phone: raw.phone, email: raw.email, photo: raw.photo, notes: raw.notes, guardian: { dni: g.dni, names: g.names, surnames: g.surnames, relationship: g.relationship, phone: g.phone, email: g.email, address: g.address } }} />
      </Drawer>
    </div>
  )
}
