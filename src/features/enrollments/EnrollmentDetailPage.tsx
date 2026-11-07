import { ArrowLeft, Ban, CheckCircle2, FileBadge2, LogOut, Pencil, Flag } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { EnrollmentBadge, ObligationBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/Confirm'
import { Select, Textarea } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import { ErrorState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { useAsync } from '@/hooks/useAsync'
import { useCan } from '@/hooks/usePermission'
import { academicService } from '@/services/academicService'
import { enrollmentService } from '@/services/enrollmentService'
import { financialService } from '@/services/financialService'
import { userService } from '@/services/userService'
import { ENROLLMENT_TRANSITIONS } from '@/constants'
import { fmtDate, fmtDateTime, money } from '@/utils/format'
import { notify } from '@/utils/toast'
import { printConstancia } from './constancia'
import type { EnrollmentStatus } from '@/types'

export default function EnrollmentDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const can = useCan()
  const e = useAsync(() => enrollmentService.get(id), [id])
  const obs = useAsync(() => financialService.obligations({ enrollmentId: id }), [id])
  const secs = useAsync(() => academicService.sections(), [])
  const users = useAsync(() => userService.list(), [])
  const [action, setAction] = useState<EnrollmentStatus | null>(null)
  const [editing, setEditing] = useState(false)
  const [sectionId, setSectionId] = useState('')
  const [cond, setCond] = useState('')

  if (e.error) return <Card><ErrorState message={e.error} onRetry={e.reload} /></Card>
  if (!e.data) return <div className="space-y-4"><Skeleton className="h-36 rounded-[20px]" /><Skeleton className="h-80 rounded-[14px]" /></div>
  const r = e.data
  const next = ENROLLMENT_TRANSITIONS[r.status]
  const closed = next.length === 0
  const labels: Record<string, { label: string; icon: React.ReactNode; danger?: boolean; tone: 'primary' | 'danger' }> = {
    matriculado: { label: 'Confirmar matrícula', icon: <CheckCircle2 />, tone: 'primary' },
    retirado: { label: 'Registrar retiro', icon: <LogOut />, tone: 'danger', danger: true },
    anulado: { label: 'Anular matrícula', icon: <Ban />, tone: 'danger', danger: true },
    finalizado: { label: 'Finalizar', icon: <Flag />, tone: 'primary' },
  }
  const sameGradeSections = secs.data?.filter((s) => s.yearId === r.yearId && s.gradeId === r.gradeId) ?? []

  return (
    <div className="space-y-6">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-ink"><ArrowLeft className="size-4" />Volver</button>
      <div className="hero-surface rounded-[20px] p-6 text-white shadow-card sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><p className="font-mono text-xs text-white/60">{r.code}</p>
            <h1 className="mt-1 text-[26px] font-semibold tracking-tight">{r.studentName}</h1>
            <p className="mt-1 text-sm text-white/70">{r.gradeName} · Sección {r.sectionName} · Año {r.year}</p>
            <div className="mt-3"><EnrollmentBadge status={r.status} /></div></div>
          <div className="flex flex-wrap gap-2">
            <Button className="!bg-white !text-[#173d91]" icon={<FileBadge2 />} disabled={r.status === 'anulado'} onClick={() => { printConstancia(r.id); notify.success('Constancia generada') }}>Constancia</Button>
            <Link to={`/academico/estudiantes/${r.studentId}`}><Button variant="ghost" className="!text-white ring-1 ring-white/30 hover:!bg-white/10">Ver estudiante</Button></Link>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-3 gap-3">{[['Total', r.total], ['Pagado', r.paid], ['Saldo', r.balance]].map(([l, v]) => <div key={l as string} className="rounded-xl bg-white/10 px-4 py-3 ring-1 ring-white/10"><p className="text-xs text-white/60">{l}</p><p className="text-lg font-semibold tabular">{money(v as number)}</p></div>)}</div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 overflow-hidden"><CardHeader title="Obligaciones económicas" description="Generadas a partir de la matrícula" action={<Link to={`/economico/pagos?nuevo=1&matricula=${r.id}`}><Button size="sm" disabled={!can('payments.write') || r.status === 'anulado'}>Registrar pago</Button></Link>} />
          <div className="overflow-x-auto"><table className="w-full min-w-max text-[13px]"><thead className="bg-surface-2 text-[11.5px] uppercase tracking-wider text-muted"><tr>{['Concepto', 'Vence', 'Importe', 'Pagado', 'Saldo', 'Estado'].map((h) => <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-line">{obs.data?.map((o) => <tr key={o.id} className="hover:bg-primary-soft/30"><td className="px-4 py-2.5 font-medium">{o.label}</td><td className="px-4 py-2.5">{fmtDate(o.dueDate)}</td><td className="px-4 py-2.5 tabular">{money(o.amount)}</td><td className="px-4 py-2.5 tabular">{money(o.paid)}</td><td className="px-4 py-2.5 font-semibold tabular">{money(o.balance)}</td><td className="px-4 py-2.5"><ObligationBadge status={o.status} /></td></tr>)}</tbody></table></div></Card>

        <div className="space-y-4">
          <Card><CardHeader title="Acciones" />
            <div className="space-y-2 px-5 pb-5">
              {closed ? <p className="text-sm text-muted">Matrícula cerrada: no admite más cambios. El historial se conserva.</p> : <>
                <Button variant="secondary" className="w-full" icon={<Pencil />} disabled={!can('enrollments.write')} onClick={() => { setSectionId(r.sectionId); setCond(r.conditions); setEditing(true) }}>Editar sección y condiciones</Button>
                {next.map((n) => <Button key={n} variant={labels[n].danger ? 'secondary' : 'primary'} className={`w-full ${labels[n].danger ? '!text-danger' : ''}`} icon={labels[n].icon} disabled={!can(n === 'anulado' || n === 'retirado' ? 'enrollments.cancel' : 'enrollments.write') && !can('enrollments.write')} onClick={() => setAction(n)}>{labels[n].label}</Button>)}</>}
            </div></Card>
          <Card><CardHeader title="Historial de la matrícula" />
            <ol className="space-y-4 px-5 pb-5">{[...r.events].reverse().map((ev, i) => (
              <li key={i} className="flex gap-3"><span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" /><div><div className="flex items-center gap-2"><EnrollmentBadge status={ev.status} /></div><p className="mt-1 text-[13px]">{ev.note}</p><p className="text-xs text-muted">{users.data?.find((u) => u.id === ev.userId)?.name ?? '—'} · {fmtDateTime(ev.at)}</p></div></li>))}</ol></Card>
          {r.conditions && <Card className="p-5"><p className="text-xs font-semibold uppercase tracking-wider text-muted">Condiciones</p><p className="mt-1 text-sm">{r.conditions}</p></Card>}
        </div>
      </div>

      <ConfirmDialog open={!!action} onOpenChange={(o) => !o && setAction(null)} tone={action ? labels[action].tone : undefined} requireReason={action === 'retirado' || action === 'anulado'} reasonLabel={action === 'anulado' ? 'Motivo de la anulación' : 'Motivo del retiro'}
        title={action ? labels[action].label : ''} confirmLabel="Confirmar"
        description={action === 'matriculado' ? 'Se generarán las mensualidades del año. Requiere la matrícula pagada.' : action === 'retirado' ? 'Se anularán las cuotas futuras sin pagos. Lo ya pagado y generado se conserva.' : action === 'anulado' ? 'Se anularán todas las obligaciones. Solo es posible si no hay pagos confirmados.' : 'La matrícula pasará a estado finalizado.'}
        onConfirm={async (reason) => { try { await enrollmentService.transition(r.id, action!, reason); notify.success('Estado actualizado') } catch (er) { notify.error(er); throw er } }} />
      <Modal open={editing} onOpenChange={setEditing} title="Editar matrícula" description="Solo se permiten cambios de sección (mismo grado) y condiciones." size="sm"
        footer={<><Button variant="ghost" onClick={() => setEditing(false)}>Cancelar</Button><Button onClick={async () => { try { await enrollmentService.update(r.id, { sectionId, conditions: cond }); notify.success('Matrícula actualizada'); setEditing(false) } catch (er) { notify.error(er) } }}>Guardar</Button></>}>
        <div className="space-y-4"><Select label="Sección" value={sectionId} onChange={(ev) => setSectionId(ev.target.value)} options={sameGradeSections.map((s) => ({ value: s.id, label: `Sección ${s.name} · ${s.vacancies} vacantes` }))} />
          <Textarea label="Condiciones" value={cond} maxLength={300} onChange={(ev) => setCond(ev.target.value)} /></div>
      </Modal>
    </div>
  )
}
