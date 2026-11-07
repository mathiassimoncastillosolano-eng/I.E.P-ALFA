import type { AccountSummary, DebtRow, ObligationConcept, ObligationStatus, ObligationView, PaymentRow } from '@/types'
import { SIM_TODAY } from '@/constants'
import { ApiError, clone, db, delay } from './db'
import { toViews } from './domain'
import { fullName, round2 } from '@/utils/format'

export interface ObligationFilters {
  yearId?: string; concept?: ObligationConcept | ''; status?: ObligationStatus | ''; period?: string; enrollmentId?: string; studentId?: string
}
export interface DebtFilters { q?: string; gradeId?: string; period?: string; mode?: 'todas' | 'vencidas' | 'parciales' | 'proximas'; yearId?: string }

export function summarize(views: ObligationView[]): AccountSummary {
  const live = views.filter((v) => !v.annulled)
  return {
    total: round2(live.reduce((a, v) => a + v.amount, 0)),
    paid: round2(live.reduce((a, v) => a + v.paid, 0)),
    pending: round2(live.reduce((a, v) => a + v.balance, 0)),
    overdue: round2(live.filter((v) => v.overdue).reduce((a, v) => a + v.balance, 0)),
    upcoming: live.filter((v) => v.balance > 0 && v.dueDate >= SIM_TODAY).sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, 4),
  }
}

export function paymentRows(filter: (p: ReturnType<typeof db>['payments'][number]) => boolean = () => true): PaymentRow[] {
  const d = db()
  return d.payments.filter(filter).map((p) => {
    const s = d.students.find((x) => x.id === p.studentId)!
    const e = d.enrollments.find((x) => x.id === p.enrollmentId)!
    const y = d.academicYears.find((x) => x.id === e.yearId)!
    const g = d.grades.find((x) => x.id === e.gradeId)!
    return {
      ...p, studentName: fullName(s), studentDni: s.dni, year: y.year, gradeName: g.name,
      details: d.paymentDetails.filter((x) => x.paymentId === p.id).map((x) => ({ ...x, label: d.obligations.find((o) => o.id === x.obligationId)?.label ?? '—' })),
    }
  }).sort((a, b) => b.date.localeCompare(a.date) || b.code.localeCompare(a.code))
}

export const financialService = {
  obligations(f: ObligationFilters = {}): Promise<ObligationView[]> {
    return delay(() => {
      const d = db()
      const list = d.obligations.filter((o) => (!f.yearId || o.yearId === f.yearId) && (!f.concept || o.concept === f.concept) && (!f.enrollmentId || o.enrollmentId === f.enrollmentId) && (!f.studentId || o.studentId === f.studentId) && (!f.period || o.period === f.period))
      return toViews(d, list).filter((v) => !f.status || v.status === f.status).sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    })
  },
  studentAccount(studentId: string, f: { yearId?: string; concept?: ObligationConcept | ''; status?: ObligationStatus | ''; period?: string } = {}) {
    return delay(() => {
      const d = db()
      const s = d.students.find((x) => x.id === studentId)
      if (!s) throw new ApiError('Estudiante no encontrado', 'NOT_FOUND')
      const all = toViews(d, d.obligations.filter((o) => o.studentId === studentId))
      const views = all.filter((v) => (!f.yearId || v.yearId === f.yearId) && (!f.concept || v.concept === f.concept) && (!f.status || v.status === f.status) && (!f.period || v.period === f.period)).sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      const pays = paymentRows((p) => p.studentId === studentId && (!f.yearId || d.enrollments.find((e) => e.id === p.enrollmentId)?.yearId === f.yearId))
      return clone({ views, summary: summarize(views), payments: pays.filter((p) => p.status === 'confirmado'), voided: pays.filter((p) => p.status === 'anulado'), allCount: all.length })
    })
  },
  debts(f: DebtFilters = {}): Promise<{ rows: DebtRow[]; summary: AccountSummary; debtors: number; delinquencyRate: number; totalActiveReceivable: number }> {
    return delay(() => {
      const d = db()
      const all = toViews(d, d.obligations.filter((o) => !f.yearId || o.yearId === f.yearId)).filter((v) => !v.annulled && v.balance > 0)
      const decorate = (v: ObligationView): DebtRow => {
        const s = d.students.find((x) => x.id === v.studentId)!
        const e = d.enrollments.find((x) => x.id === v.enrollmentId)!
        const g = d.grades.find((x) => x.id === e.gradeId)!
        const sec = d.sections.find((x) => x.id === e.sectionId)!
        const y = d.academicYears.find((x) => x.id === v.yearId)!
        return { ...v, studentName: fullName(s), studentDni: s.dni, gradeName: g.name, sectionName: sec.name, levelId: g.levelId, year: y.year }
      }
      const q = f.q?.toLowerCase().trim()
      const rows = all.filter((v) => v.dueDate <= SIM_TODAY || (f.mode === 'proximas')).map(decorate)
        .filter((r) => !q || r.studentName.toLowerCase().includes(q) || r.studentDni.includes(q))
        .filter((r) => !f.gradeId || d.enrollments.find((e) => e.id === r.enrollmentId)?.gradeId === f.gradeId)
        .filter((r) => !f.period || r.period === f.period)
        .filter((r) => f.mode === 'vencidas' ? r.overdue : f.mode === 'parciales' ? r.status === 'parcial' : f.mode === 'proximas' ? r.dueDate >= SIM_TODAY && r.dueDate <= '2026-12-31' : true)
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      const overdueAll = all.filter((v) => v.overdue)
      const debtors = new Set(overdueAll.map((v) => v.studentId)).size
      const activeStudents = new Set(d.enrollments.filter((e) => e.status === 'matriculado' || e.status === 'pendiente').map((e) => e.studentId)).size
      const dueTotal = toViews(d, d.obligations.filter((o) => !o.annulled && o.dueDate <= SIM_TODAY && (!f.yearId || o.yearId === f.yearId)))
      const dueAmount = dueTotal.reduce((a, v) => a + v.amount, 0)
      const overdueAmount = dueTotal.filter((v) => v.overdue).reduce((a, v) => a + v.balance, 0)
      return clone({
        rows, summary: summarize(all), debtors, delinquencyRate: activeStudents ? (debtors / activeStudents) * 100 : 0,
        totalActiveReceivable: dueAmount ? (overdueAmount / dueAmount) * 100 : 0,
      })
    }, 300)
  },
}
