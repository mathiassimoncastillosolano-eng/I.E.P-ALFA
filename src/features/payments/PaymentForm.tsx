import { zodResolver } from '@hookform/resolvers/zod'
import { Wand2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Avatar } from '@/components/ui/Avatar'
import { ObligationBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { DateField, Input, SearchInput, Select, Textarea } from '@/components/ui/Field'
import { paymentSchema, type PaymentFormValues } from '@/schemas'
import { enrollmentService } from '@/services/enrollmentService'
import { financialService } from '@/services/financialService'
import { paymentService } from '@/services/paymentService'
import { studentService } from '@/services/studentService'
import { useAsync } from '@/hooks/useAsync'
import { useDebounced } from '@/hooks/useDebounced'
import { PAYMENT_METHOD_LABEL, SIM_TODAY } from '@/constants'
import { fmtDate, money, round2 } from '@/utils/format'
import { notify } from '@/utils/toast'
import type { StudentRow } from '@/types'

export function PaymentForm({ initialEnrollmentId, initialStudentId, onDone }: { initialEnrollmentId?: string; initialStudentId?: string; onDone: () => void }) {
  const [student, setStudent] = useState<StudentRow | null>(null)
  const [q, setQ] = useState('')
  const dq = useDebounced(q)
  const [results, setResults] = useState<StudentRow[]>([])
  const [enrollmentId, setEnrollmentId] = useState(initialEnrollmentId ?? '')
  const [alloc, setAlloc] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const { register, handleSubmit, watch, formState: { errors } } = useForm<PaymentFormValues>({ resolver: zodResolver(paymentSchema), defaultValues: { method: 'efectivo', date: SIM_TODAY, operationNumber: '', notes: '' } })
  const method = watch('method')

  useEffect(() => {
    const sid = initialStudentId
    if (sid) studentService.get(sid).then((r) => setStudent(r.student))
    if (initialEnrollmentId) enrollmentService.get(initialEnrollmentId).then((e) => studentService.get(e.studentId).then((r) => setStudent(r.student)))
  }, [initialEnrollmentId, initialStudentId])
  useEffect(() => { if (!dq.trim()) { setResults([]); return } let live = true; studentService.search(dq).then((r) => live && setResults(r)); return () => { live = false } }, [dq])

  const enrs = useAsync(() => (student ? enrollmentService.list({ studentId: student.id }) : Promise.resolve([])), [student?.id])
  const payable = useMemo(() => enrs.data?.filter((e) => e.status !== 'anulado') ?? [], [enrs.data])
  useEffect(() => { if (student && payable.length && !payable.some((e) => e.id === enrollmentId)) setEnrollmentId(payable.find((e) => e.balance > 0)?.id ?? payable[0].id) }, [student, payable, enrollmentId])
  const obs = useAsync(() => (enrollmentId ? financialService.obligations({ enrollmentId }) : Promise.resolve([])), [enrollmentId])
  const open = (obs.data ?? []).filter((o) => !o.annulled && o.balance > 0)
  useEffect(() => { setAlloc({}) }, [enrollmentId])

  const total = round2(Object.values(alloc).reduce((a, v) => a + (Number(v) || 0), 0))
  const setOne = (id: string, v: string, max: number) => setAlloc((a) => ({ ...a, [id]: v === '' ? '' : String(Math.min(Math.max(Number(v), 0), max)) }))
  const autoApply = (amount: number) => { let rest = amount; const a: Record<string, string> = {}; for (const o of open) { if (rest <= 0) break; const p = Math.min(o.balance, rest); a[o.id] = String(round2(p)); rest = round2(rest - p) } setAlloc(a) }

  const submit = handleSubmit(async (v) => {
    const allocations = Object.entries(alloc).map(([obligationId, a]) => ({ obligationId, amount: Number(a) })).filter((a) => a.amount > 0)
    if (!allocations.length) { notify.error(new Error('Indique el importe a pagar en al menos una obligación')); return }
    setBusy(true)
    try {
      const p = await paymentService.register({ enrollmentId, ...v, allocations })
      notify.success('Pago registrado', `${p.code} · ${money(p.total)}`)
      onDone()
    } catch (e) { notify.error(e) } finally { setBusy(false) }
  })

  return (
    <form onSubmit={submit} className="space-y-6" noValidate>
      <section className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">1 · Estudiante y matrícula</p>
        {!student ? <><SearchInput value={q} onChange={setQ} placeholder="Buscar estudiante por nombre, DNI o código…" />
          {results.length > 0 && <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line">{results.map((r) => <li key={r.id}><button type="button" onClick={() => { setStudent(r); setQ('') }} className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-primary-soft/40"><Avatar name={r.fullName} size="sm" /><div><p className="text-sm font-medium">{r.fullName}</p><p className="text-xs text-muted">DNI {r.dni}</p></div></button></li>)}</ul>}</>
          : <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary-soft/40 p-3"><Avatar name={student.fullName} /><div className="flex-1"><p className="text-sm font-semibold">{student.fullName}</p><p className="text-xs text-muted">DNI {student.dni}</p></div>{!initialEnrollmentId && !initialStudentId && <Button variant="ghost" size="sm" onClick={() => { setStudent(null); setEnrollmentId('') }}>Cambiar</Button>}</div>}
        {student && <Select label="Matrícula asociada" value={enrollmentId} onChange={(e) => setEnrollmentId(e.target.value)} options={payable.map((e) => ({ value: e.id, label: `${e.year} · ${e.gradeName} ${e.sectionName} · saldo ${money(e.balance)}` }))} />}
      </section>

      {enrollmentId && <section className="space-y-3">
        <div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-wider text-muted">2 · Obligaciones a pagar</p>
          {open.length > 0 && <button type="button" onClick={() => autoApply(open.reduce((a, o) => a + o.balance, 0))} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"><Wand2 className="size-3.5" />Pagar todo</button>}</div>
        {open.length === 0 ? <p className="rounded-xl bg-success-soft p-4 text-sm text-success">Esta matrícula no tiene saldos pendientes.</p> : (
          <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line">{open.map((o) => (
            <li key={o.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1"><p className="text-[13px] font-medium">{o.label}</p><p className="text-xs text-muted">Vence {fmtDate(o.dueDate)} · Saldo <b className="text-ink">{money(o.balance)}</b></p></div>
              <ObligationBadge status={o.status} />
              <div className="flex items-center gap-1.5"><input aria-label={`Importe para ${o.label}`} type="number" step="0.01" min={0} max={o.balance} value={alloc[o.id] ?? ''} placeholder="0.00" onChange={(e) => setOne(o.id, e.target.value, o.balance)} className="h-9 w-28 rounded-lg border border-line-strong bg-surface px-2.5 text-right text-sm tabular focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15" />
                <button type="button" onClick={() => setOne(o.id, String(o.balance), o.balance)} className="rounded-md px-2 py-1 text-xs font-medium text-primary hover:bg-primary-soft">Total</button></div>
            </li>))}</ul>)}
        <div className="flex items-center justify-between rounded-xl bg-surface-2 px-4 py-3"><span className="text-sm text-muted">Total del pago</span><span className="text-xl font-semibold tabular">{money(total)}</span></div>
        <p className="text-xs text-muted">No se aceptan importes superiores al saldo de cada obligación. Un pago puede cubrir varias obligaciones.</p>
      </section>}

      <section className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">3 · Datos del pago</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Método de pago" required options={Object.entries(PAYMENT_METHOD_LABEL).map(([value, label]) => ({ value, label }))} {...register('method')} />
          <DateField label="Fecha de pago" required max={SIM_TODAY} error={errors.date?.message} {...register('date')} />
          <Input label="N.º de operación" className="sm:col-span-2" disabled={method === 'efectivo'} placeholder={method === 'efectivo' ? 'No aplica en efectivo' : 'Código de operación'} error={errors.operationNumber?.message} {...register('operationNumber')} />
          <Textarea label="Observaciones" className="sm:col-span-2" maxLength={200} {...register('notes')} />
        </div>
      </section>
      <div className="flex justify-end gap-2 border-t border-line pt-5"><Button variant="ghost" onClick={onDone}>Cancelar</Button><Button type="submit" loading={busy} disabled={!enrollmentId || total <= 0}>Confirmar pago · {money(total)}</Button></div>
    </form>
  )
}
