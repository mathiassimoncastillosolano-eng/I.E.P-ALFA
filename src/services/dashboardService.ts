import { MONTH_NAMES, SIM_TODAY } from '@/constants'
import { clone, db, delay } from './db'
import { toViews } from './domain'
import { paymentRows } from './financialService'
import { round2 } from '@/utils/format'

export const MONTHS_SHORT = MONTH_NAMES.map((m) => m.slice(0, 3))

export function monthlyIncome(year: number) {
  const pays = db().payments.filter((p) => p.status === 'confirmado' && p.date.startsWith(String(year)))
  const arr = MONTHS_SHORT.map((m) => ({ month: m, total: 0 }))
  for (const p of pays) arr[Number(p.date.slice(5, 7)) - 1].total += p.total
  return arr.map((a) => ({ ...a, total: round2(a.total) }))
}

export function dueVsPaid(yearId: string) {
  const d = db()
  const views = toViews(d, d.obligations.filter((o) => o.yearId === yearId && !o.annulled))
  const y = d.academicYears.find((x) => x.id === yearId)!
  const arr = MONTHS_SHORT.map((m) => ({ month: m, paid: 0, pending: 0 }))
  for (const v of views) {
    if (v.dueDate.slice(0, 4) !== String(y.year)) continue
    const i = Number(v.dueDate.slice(5, 7)) - 1
    arr[i].paid += v.paid; arr[i].pending += v.balance
  }
  return arr.map((a) => ({ ...a, paid: round2(a.paid), pending: round2(a.pending) }))
}

export const dashboardService = {
  get(yearId: string) {
    return delay(() => {
      const d = db()
      const year = d.academicYears.find((y) => y.id === yearId)!
      const enrYear = d.enrollments.filter((e) => e.yearId === yearId)
      const live = enrYear.filter((e) => e.status !== 'anulado')
      const views = toViews(d, d.obligations.filter((o) => o.yearId === yearId))
      const liveViews = views.filter((v) => !v.annulled)
      const exigible = liveViews.filter((v) => v.dueDate <= SIM_TODAY)
      const pendingTuition = liveViews.filter((v) => v.concept === 'mensualidad' && v.balance > 0 && v.dueDate <= SIM_TODAY)
      const debtors = new Set(liveViews.filter((v) => v.overdue).map((v) => v.studentId))
      const monthKey = SIM_TODAY.slice(0, 7)
      const confirmed = d.payments.filter((p) => p.status === 'confirmado')
      const yearPays = confirmed.filter((p) => d.enrollments.find((e) => e.id === p.enrollmentId)?.yearId === yearId)
      const monthCollection = yearPays.filter((p) => p.date.startsWith(monthKey)).reduce((a, p) => a + p.total, 0)
      const prevMonthKey = '2026-10'
      const prevCollection = yearPays.filter((p) => p.date.startsWith(prevMonthKey)).reduce((a, p) => a + p.total, 0)

      const byLevel = (['primaria', 'secundaria'] as const).map((lv) => ({
        name: lv === 'primaria' ? 'Primaria' : 'Secundaria',
        value: live.filter((e) => d.grades.find((g) => g.id === e.gradeId)?.levelId === lv && (e.status === 'matriculado' || e.status === 'pendiente')).length,
      }))
      const byGrade = [...d.grades].sort((a, b) => a.order - b.order).map((g) => ({
        name: g.short, level: g.levelId, value: live.filter((e) => e.gradeId === g.id && (e.status === 'matriculado' || e.status === 'pendiente')).length,
      }))

      const annual = d.academicYears.map((y) => ({
        year: String(y.year),
        total: round2(confirmed.filter((p) => d.enrollments.find((e) => e.id === p.enrollmentId)?.yearId === y.id).reduce((a, p) => a + p.total, 0)),
        expected: round2(toViews(d, d.obligations.filter((o) => o.yearId === y.id && !o.annulled)).reduce((a, v) => a + v.amount, 0)),
      })).sort((a, b) => a.year.localeCompare(b.year)).filter((a) => a.total > 0 || a.expected > 0)

      const alerts: { id: string; level: 'danger' | 'warning' | 'info'; title: string; detail: string; href: string }[] = []
      const overdueSum = exigible.filter((v) => v.overdue).reduce((a, v) => a + v.balance, 0)
      if (debtors.size) alerts.push({ id: 'a1', level: 'danger', title: `${debtors.size} estudiantes con deuda vencida`, detail: `Monto vencido acumulado S/ ${overdueSum.toFixed(2)}`, href: '/economico/deudas' })
      const pend = live.filter((e) => e.status === 'pendiente').length
      if (pend) alerts.push({ id: 'a2', level: 'warning', title: `${pend} matrículas pendientes de completar`, detail: 'Falta el pago del concepto de matrícula', href: '/academico/matriculas?estado=pendiente' })
      const dueSoon = liveViews.filter((v) => v.balance > 0 && v.dueDate >= SIM_TODAY && v.dueDate <= '2026-11-30').length
      if (dueSoon) alerts.push({ id: 'a3', level: 'info', title: `${dueSoon} obligaciones vencen este mes`, detail: 'Revise los próximos vencimientos', href: '/economico/deudas?modo=proximas' })

      return clone({
        year: year.year,
        kpis: {
          totalStudents: d.students.length,
          enrolled: live.filter((e) => e.status === 'matriculado').length,
          pendingEnrollments: pend,
          totalIncome: round2(yearPays.reduce((a, p) => a + p.total, 0)),
          pendingTuitionAmount: round2(pendingTuition.reduce((a, v) => a + v.balance, 0)),
          pendingTuitionCount: pendingTuition.length,
          debtors: debtors.size,
          monthCollection: round2(monthCollection),
          monthTrend: prevCollection ? ((monthCollection - prevCollection) / prevCollection) * 100 : 0,
        },
        monthlyIncome: monthlyIncome(year.year),
        byLevel, byGrade, dueVsPaid: dueVsPaid(yearId), annual,
        recentEnrollments: enrYear.sort((a, b) => b.enrolledAt.localeCompare(a.enrolledAt)).slice(0, 5).map((e) => {
          const s = d.students.find((x) => x.id === e.studentId)!
          return { id: e.id, code: e.code, studentId: s.id, name: `${s.names} ${s.paternalSurname}`, grade: d.grades.find((g) => g.id === e.gradeId)!.short, status: e.status, date: e.enrolledAt }
        }),
        recentPayments: paymentRows((p) => p.status === 'confirmado').slice(0, 5).map((p) => ({ id: p.id, code: p.code, name: p.studentName, total: p.total, method: p.method, date: p.date })),
        upcoming: liveViews.filter((v) => v.balance > 0 && v.dueDate >= SIM_TODAY).sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, 40).reduce<{ date: string; label: string; count: number; amount: number }[]>((acc, v) => {
          const key = v.dueDate
          const hit = acc.find((x) => x.date === key)
          if (hit) { hit.count++; hit.amount += v.balance } else acc.push({ date: key, label: v.label, count: 1, amount: v.balance })
          return acc
        }, []).slice(0, 4),
        activity: [...d.audit].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 6),
        alerts,
        receivableRate: exigible.reduce((a, v) => a + v.amount, 0) ? round2((exigible.reduce((a, v) => a + v.paid, 0) / exigible.reduce((a, v) => a + v.amount, 0)) * 100) : 0,
      })
    }, 350)
  },
}
