import { SIM_TODAY } from '@/constants'
import type { Database, Obligation, ObligationView, ObligationStatus } from '@/types'
import { daysBetween, round2 } from '@/utils/format'

/** Importe pagado por obligación: solo cuenta pagos confirmados. */
export function paidByObligation(d: Database): Map<string, number> {
  const confirmed = new Set(d.payments.filter((p) => p.status === 'confirmado').map((p) => p.id))
  const m = new Map<string, number>()
  for (const det of d.paymentDetails) {
    if (!confirmed.has(det.paymentId)) continue
    m.set(det.obligationId, round2((m.get(det.obligationId) ?? 0) + det.amount))
  }
  return m
}

export function deriveStatus(o: Obligation, paid: number): ObligationStatus {
  if (o.annulled) return 'anulada'
  if (paid >= o.amount - 0.001) return 'pagada'
  if (paid > 0) return 'parcial'
  if (o.dueDate < SIM_TODAY) return 'vencida'
  return o.dueDate.slice(0, 7) > SIM_TODAY.slice(0, 7) ? 'programada' : 'pendiente'
}

export function toViews(d: Database, list: Obligation[] = d.obligations): ObligationView[] {
  const paidMap = paidByObligation(d)
  return list.map((o) => {
    const paid = o.annulled ? 0 : paidMap.get(o.id) ?? 0
    const status = deriveStatus(o, paid)
    const balance = o.annulled ? 0 : Math.max(0, round2(o.amount - paid))
    const overdue = !o.annulled && balance > 0 && o.dueDate < SIM_TODAY
    return { ...o, paid, balance, status, overdue, daysOverdue: overdue ? daysBetween(o.dueDate, SIM_TODAY) : 0 }
  })
}

/** Obligación con saldo pendiente (vigente o vencida). */
export const hasBalance = (v: ObligationView) => !v.annulled && v.balance > 0
