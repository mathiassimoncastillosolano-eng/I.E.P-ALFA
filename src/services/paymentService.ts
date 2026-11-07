import type { Payment, PaymentMethod, PaymentRow } from '@/types'
import { paymentSchema } from '@/schemas'
import { SIM_TODAY } from '@/constants'
import { ApiError, clone, commit, db, delay, logAudit, nextCode, nextId, currentUser } from './db'
import { toViews } from './domain'
import { paymentRows } from './financialService'
import { fullName, money, round2 } from '@/utils/format'

export interface PaymentFilters { q?: string; method?: PaymentMethod | ''; status?: 'confirmado' | 'anulado' | ''; yearId?: string; studentId?: string }
export interface RegisterPaymentInput {
  enrollmentId: string
  method: PaymentMethod
  date: string
  operationNumber: string
  notes: string
  allocations: { obligationId: string; amount: number }[]
}

export const paymentService = {
  list(f: PaymentFilters = {}): Promise<PaymentRow[]> {
    return delay(() => {
      const q = f.q?.toLowerCase().trim()
      return clone(paymentRows((p) => (!f.method || p.method === f.method) && (!f.status || p.status === f.status) && (!f.studentId || p.studentId === f.studentId)))
        .filter((p) => !f.yearId || db().academicYears.find((y) => y.id === f.yearId)?.year === p.year)
        .filter((p) => !q || p.studentName.toLowerCase().includes(q) || p.studentDni.includes(q) || p.code.toLowerCase().includes(q) || p.operationNumber.includes(q))
    })
  },
  get(id: string): Promise<PaymentRow> {
    return delay(() => {
      const r = paymentRows((p) => p.id === id)[0]
      if (!r) throw new ApiError('Pago no encontrado', 'NOT_FOUND')
      return clone(r)
    }, 150)
  },
  register(input: RegisterPaymentInput): Promise<Payment> {
    return delay(() => {
      const d = db()
      const meta = paymentSchema.safeParse(input)
      if (!meta.success) throw new ApiError(meta.error.issues[0].message)
      if (input.date > SIM_TODAY) throw new ApiError('La fecha de pago no puede ser posterior a la fecha actual del sistema')
      const enr = d.enrollments.find((e) => e.id === input.enrollmentId)
      if (!enr) throw new ApiError('Matrícula asociada no encontrada', 'NOT_FOUND')
      if (enr.status === 'anulado') throw new ApiError('No se registran pagos en matrículas anuladas')
      const allocs = input.allocations.filter((a) => a.amount > 0)
      if (!allocs.length) throw new ApiError('Seleccione al menos una obligación e indique el importe')
      if (new Set(allocs.map((a) => a.obligationId)).size !== allocs.length) throw new ApiError('Hay obligaciones repetidas en el pago')
      if (input.method !== 'efectivo' && d.payments.some((p) => p.status === 'confirmado' && p.method === input.method && p.operationNumber === input.operationNumber.trim())) {
        throw new ApiError(`El número de operación ${input.operationNumber} ya fue registrado (posible pago duplicado)`, 'DUPLICATE')
      }
      const views = toViews(d, d.obligations.filter((o) => o.enrollmentId === enr.id))
      let total = 0
      for (const a of allocs) {
        const v = views.find((x) => x.id === a.obligationId)
        if (!v) throw new ApiError('Una obligación no pertenece a la matrícula seleccionada')
        if (v.annulled) throw new ApiError(`${v.label} está anulada`)
        if (round2(a.amount) > v.balance + 0.001) throw new ApiError(`El importe para ${v.label} (${money(a.amount)}) supera el saldo pendiente (${money(v.balance)})`, 'OVERPAYMENT')
        total += a.amount
      }
      const p: Payment = {
        id: nextId('pay'), code: nextCode('RC'), studentId: enr.studentId, enrollmentId: enr.id, date: input.date, method: input.method,
        operationNumber: input.operationNumber.trim(), total: round2(total), notes: input.notes, status: 'confirmado', userId: currentUser().id,
      }
      d.payments.push(p)
      for (const a of allocs) d.paymentDetails.push({ id: nextId('pd'), paymentId: p.id, obligationId: a.obligationId, amount: round2(a.amount) })
      const st = d.students.find((s) => s.id === enr.studentId)!
      logAudit('crear', 'pagos', `Registró pago ${p.code} por ${money(p.total)} de ${fullName(st)}`, p.code)
      commit()
      return clone(p)
    }, 650)
  },
  void(id: string, reason: string): Promise<Payment> {
    return delay(() => {
      const d = db()
      const p = d.payments.find((x) => x.id === id)
      if (!p) throw new ApiError('Pago no encontrado', 'NOT_FOUND')
      if (p.status === 'anulado') throw new ApiError('El pago ya fue anulado')
      if (reason.trim().length < 5) throw new ApiError('Indique el motivo de la anulación (mín. 5 caracteres)')
      p.status = 'anulado'; p.voidReason = reason.trim(); p.voidedAt = new Date().toISOString().slice(0, 19); p.voidedBy = currentUser().id
      logAudit('reversar', 'pagos', `Anuló el pago ${p.code} (${money(p.total)}): ${p.voidReason}`, p.code)
      commit()
      return clone(p)
    }, 500)
  },
}
