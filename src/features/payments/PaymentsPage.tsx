import type { ColumnDef } from '@tanstack/react-table'
import { Ban, Eye, MoreHorizontal, Plus, Printer } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Badge } from '@/components/ui/Badge'
import { Button, IconButton } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/Confirm'
import { DataTable } from '@/components/ui/DataTable'
import { Dropdown } from '@/components/ui/Dropdown'
import { SearchInput, Select } from '@/components/ui/Field'
import { Drawer } from '@/components/ui/Modal'
import { FilterPanel } from '@/components/shared/FilterPanel'
import { PageHeader } from '@/components/shared/PageHeader'
import { useAsync } from '@/hooks/useAsync'
import { useCan } from '@/hooks/usePermission'
import { useDebounced } from '@/hooks/useDebounced'
import { paymentService } from '@/services/paymentService'
import { PAYMENT_METHOD_LABEL } from '@/constants'
import { fmtDate, money } from '@/utils/format'
import { notify } from '@/utils/toast'
import type { PaymentMethod, PaymentRow } from '@/types'
import { PaymentForm } from './PaymentForm'
import { printReceipt } from './receipt'

export default function PaymentsPage() {
  const can = useCan()
  const [sp, setSp] = useSearchParams()
  const [q, setQ] = useState('')
  const [method, setMethod] = useState<PaymentMethod | ''>('')
  const [status, setStatus] = useState<'confirmado' | 'anulado' | ''>('')
  const dq = useDebounced(q)
  const [detail, setDetail] = useState<PaymentRow | null>(null)
  const [voiding, setVoiding] = useState<PaymentRow | null>(null)
  const list = useAsync(() => paymentService.list({ q: dq, method, status }), [dq, method, status])
  const formOpen = sp.get('nuevo') === '1'
  const closeForm = () => { sp.delete('nuevo'); sp.delete('matricula'); sp.delete('estudiante'); setSp(sp, { replace: true }) }

  const columns = useMemo<ColumnDef<PaymentRow, unknown>[]>(() => [
    { accessorKey: 'code', header: 'Comprobante', cell: (c) => <span className="font-mono text-xs font-medium">{c.getValue() as string}</span> },
    { accessorKey: 'date', header: 'Fecha', cell: (c) => fmtDate(c.getValue() as string) },
    { id: 'st', accessorFn: (r) => r.studentName, header: 'Estudiante', cell: ({ row: { original: r } }) => <div><p className="font-medium">{r.studentName}</p><p className="text-xs text-muted">{r.gradeName} · {r.year}</p></div> },
    { id: 'c', header: 'Concepto', enableSorting: false, cell: ({ row: { original: r } }) => <span className="text-muted">{r.details.length > 1 ? `${r.details[0].label} +${r.details.length - 1}` : r.details[0]?.label}</span> },
    { accessorKey: 'method', header: 'Método', cell: (c) => PAYMENT_METHOD_LABEL[c.getValue() as PaymentMethod] },
    { accessorKey: 'total', header: 'Importe', meta: { align: 'right' }, cell: ({ row: { original: r } }) => <b className={r.status === 'anulado' ? 'text-muted line-through' : ''}>{money(r.total)}</b> },
    { accessorKey: 'status', header: 'Estado', cell: ({ row: { original: r } }) => r.status === 'anulado' ? <Badge tone="danger">Anulado</Badge> : <Badge tone="success">Confirmado</Badge> },
    { id: 'a', header: '', enableSorting: false, cell: ({ row: { original: r } }) => (
      <div className="flex justify-end"><Dropdown trigger={<IconButton label="Acciones"><MoreHorizontal /></IconButton>} items={[
        { label: 'Ver detalle', icon: <Eye />, onSelect: () => setDetail(r) },
        { label: 'Imprimir comprobante', icon: <Printer />, onSelect: () => printReceipt(r.id) },
        { label: 'Anular pago…', icon: <Ban />, danger: true, separatorBefore: true, disabled: r.status === 'anulado' || !can('payments.void'), onSelect: () => setVoiding(r) },
      ]} /></div>) },
  ], [can])

  return (
    <>
      <PageHeader eyebrow="Gestión económica" title="Pagos" description="Pagos simulados. Los pagos confirmados no se eliminan: se anulan con trazabilidad."
        actions={<Button icon={<Plus />} disabled={!can('payments.write')} onClick={() => { sp.set('nuevo', '1'); setSp(sp) }}>Registrar pago</Button>} />
      <DataTable data={list.data} loading={list.loading} error={list.error} onRetry={list.reload} columns={columns} resetKey={`${dq}${method}${status}`} onRowClick={setDetail}
        empty={{ title: 'Sin pagos', description: 'No hay pagos que coincidan con la búsqueda.' }}
        toolbar={<FilterPanel active={!!(q || method || status)} onClear={() => { setQ(''); setMethod(''); setStatus('') }}>
          <SearchInput value={q} onChange={setQ} placeholder="Comprobante, estudiante, DNI u operación…" className="w-full sm:w-80" />
          <Select aria-label="Método" value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod | '')} placeholder="Todos los métodos" options={Object.entries(PAYMENT_METHOD_LABEL).map(([value, label]) => ({ value, label }))} className="w-52" />
          <Select aria-label="Estado" value={status} onChange={(e) => setStatus(e.target.value as 'confirmado' | 'anulado' | '')} placeholder="Todos los estados" options={[{ value: 'confirmado', label: 'Confirmado' }, { value: 'anulado', label: 'Anulado' }]} className="w-44" />
        </FilterPanel>} />

      <Drawer open={formOpen} onOpenChange={(o) => !o && closeForm()} width="max-w-2xl" title="Registrar pago" description="Seleccione la matrícula y distribuya el importe entre las obligaciones.">
        <PaymentForm initialEnrollmentId={sp.get('matricula') ?? undefined} initialStudentId={sp.get('estudiante') ?? undefined} onDone={closeForm} />
      </Drawer>

      <Drawer open={!!detail} onOpenChange={(o) => !o && setDetail(null)} title={`Comprobante ${detail?.code}`} description={detail?.studentName}
        footer={detail && <><Button variant="secondary" icon={<Printer />} onClick={() => printReceipt(detail.id)}>Imprimir</Button>{detail.status === 'confirmado' && <Button variant="danger" icon={<Ban />} disabled={!can('payments.void')} onClick={() => { setVoiding(detail); setDetail(null) }}>Anular</Button>}</>}>
        {detail && <dl className="space-y-4 text-sm">
          {[['Fecha', fmtDate(detail.date)], ['Método', PAYMENT_METHOD_LABEL[detail.method]], ['N.º de operación', detail.operationNumber || '—'], ['Importe total', money(detail.total)], ['Observaciones', detail.notes || '—']].map(([k, v]) => <div key={k} className="flex justify-between gap-4 border-b border-line pb-3"><dt className="text-muted">{k}</dt><dd className="font-medium">{v}</dd></div>)}
          <div><p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Aplicado a</p><ul className="space-y-2">{detail.details.map((d) => <li key={d.id} className="flex justify-between rounded-lg bg-surface-2 px-3 py-2"><span>{d.label}</span><b className="tabular">{money(d.amount)}</b></li>)}</ul></div>
          {detail.status === 'anulado' && <div className="rounded-xl bg-danger-soft p-4 text-danger"><p className="font-semibold">Pago anulado</p><p className="mt-1 text-[13px]">{detail.voidReason}</p></div>}
        </dl>}
      </Drawer>

      <ConfirmDialog open={!!voiding} onOpenChange={(o) => !o && setVoiding(null)} tone="danger" requireReason reasonLabel="Motivo de la anulación" title={`Anular pago ${voiding?.code}`} confirmLabel="Anular pago"
        description={<>Se revertirá el pago de <b>{voiding && money(voiding.total)}</b> y los saldos se recalcularán. El registro se conserva en auditoría.</>}
        onConfirm={async (reason) => { try { await paymentService.void(voiding!.id, reason); notify.success('Pago anulado', 'Saldos actualizados') } catch (e) { notify.error(e); throw e } }} />
    </>
  )
}
