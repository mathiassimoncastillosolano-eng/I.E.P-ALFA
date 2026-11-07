import { useState, type ReactNode } from 'react'
import { AlertTriangle, ShieldQuestion } from 'lucide-react'
import { Modal } from './Modal'
import { Button } from './Button'
import { Textarea } from './Field'

interface Props {
  open: boolean
  onOpenChange: (o: boolean) => void
  title: string
  description: ReactNode
  confirmLabel?: string
  tone?: 'primary' | 'danger'
  requireReason?: boolean
  reasonLabel?: string
  onConfirm: (reason: string) => Promise<unknown> | void
}

export function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel = 'Confirmar', tone = 'primary', requireReason, reasonLabel = 'Motivo', onConfirm }: Props) {
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const close = (o: boolean) => { if (!busy) { onOpenChange(o); if (!o) { setReason(''); setError('') } } }
  const submit = async () => {
    if (requireReason && reason.trim().length < 5) { setError('Describa el motivo (mín. 5 caracteres)'); return }
    setBusy(true)
    try { await onConfirm(reason.trim()); setReason(''); setError(''); onOpenChange(false) } catch { /* el llamador muestra el error */ } finally { setBusy(false) }
  }
  return (
    <Modal open={open} onOpenChange={close} title={title} size="sm"
      footer={<><Button variant="ghost" onClick={() => close(false)} disabled={busy}>Cancelar</Button><Button variant={tone === 'danger' ? 'danger' : 'primary'} loading={busy} onClick={submit}>{confirmLabel}</Button></>}>
      <div className="flex gap-4">
        <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${tone === 'danger' ? 'bg-danger-soft text-danger' : 'bg-primary-soft text-primary'}`}>
          {tone === 'danger' ? <AlertTriangle className="size-5" /> : <ShieldQuestion className="size-5" />}
        </div>
        <div className="min-w-0 flex-1 space-y-3 text-sm text-ink-2">
          <div>{description}</div>
          {requireReason && <Textarea label={reasonLabel} value={reason} onChange={(e) => { setReason(e.target.value); setError('') }} error={error} placeholder="Escriba el motivo…" />}
        </div>
      </div>
    </Modal>
  )
}
