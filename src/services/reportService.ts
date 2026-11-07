import type { LevelId, PaymentMethod } from '@/types'
import { clone, db, delay } from './db'
import { toViews } from './domain'
import { monthlyIncome } from './dashboardService'
import { paymentRows } from './financialService'
import { fullName, round2 } from '@/utils/format'

export type ReportId =
  | 'ac-nivel' | 'ac-grado' | 'ac-anio' | 'ac-seccion' | 'ac-retirados' | 'ac-historial'
  | 'ec-mensual' | 'ec-concepto' | 'ec-pagos' | 'ec-pendientes' | 'ec-vencidas' | 'ec-anual' | 'ec-estado-cuenta'

export interface ReportResult {
  title: string
  columns: { key: string; label: string; align?: 'left' | 'right'; money?: boolean }[]
  rows: Record<string, string | number>[]
  chart?: { type: 'bar' | 'pie'; x: string; series: { key: string; label: string }[] }
  totals?: Record<string, number>
}
export interface ReportFilters { yearId?: string; levelId?: LevelId | ''; method?: PaymentMethod | ''; studentId?: string }

export const REPORTS: { id: ReportId; group: 'academico' | 'economico'; title: string; description: string }[] = [
  { id: 'ac-nivel', group: 'academico', title: 'Estudiantes por nivel', description: 'Matriculados y pendientes en primaria y secundaria.' },
  { id: 'ac-grado', group: 'academico', title: 'Estudiantes por grado', description: 'Distribución por grado del año seleccionado.' },
  { id: 'ac-anio', group: 'academico', title: 'Matrículas por año', description: 'Comparativo de matrículas por año académico y estado.' },
  { id: 'ac-seccion', group: 'academico', title: 'Matrículas por sección', description: 'Ocupación y vacantes por sección.' },
  { id: 'ac-retirados', group: 'academico', title: 'Estudiantes retirados', description: 'Retiros registrados con fecha y motivo.' },
  { id: 'ac-historial', group: 'academico', title: 'Historial de matrícula', description: 'Trayectoria de matrículas por estudiante.' },
  { id: 'ec-mensual', group: 'economico', title: 'Ingresos mensuales', description: 'Recaudación mes a mes del año académico.' },
  { id: 'ec-concepto', group: 'economico', title: 'Ingresos por concepto', description: 'Matrícula vs mensualidades cobradas.' },
  { id: 'ec-pagos', group: 'economico', title: 'Pagos registrados', description: 'Listado de comprobantes internos.' },
  { id: 'ec-pendientes', group: 'economico', title: 'Mensualidades pendientes', description: 'Saldos por cobrar por periodo.' },
  { id: 'ec-vencidas', group: 'economico', title: 'Deudas vencidas', description: 'Obligaciones vencidas por estudiante.' },
  { id: 'ec-anual', group: 'economico', title: 'Recaudación por año académico', description: 'Esperado vs recaudado por año.' },
  { id: 'ec-estado-cuenta', group: 'economico', title: 'Estado de cuenta por estudiante', description: 'Resumen económico de cada estudiante.' },
]

const cols = (...c: ReportResult['columns']) => c

function build(id: ReportId, f: ReportFilters): ReportResult {
  const d = db()
  const year = d.academicYears.find((y) => y.id === f.yearId) ?? d.academicYears.find((y) => y.status === 'activo')!
  const enrs = d.enrollments.filter((e) => e.yearId === year.id)
  const stu = (sid: string) => d.students.find((s) => s.id === sid)!
  const grade = (gid: string) => d.grades.find((g) => g.id === gid)!
  const lvlOk = (gid: string) => !f.levelId || grade(gid).levelId === f.levelId
  const allViews = toViews(d, d.obligations.filter((o) => o.yearId === year.id && !o.annulled))

  switch (id) {
    case 'ac-nivel': {
      const rows = (['primaria', 'secundaria'] as const).map((lv) => {
        const l = enrs.filter((e) => grade(e.gradeId).levelId === lv)
        return { nivel: lv === 'primaria' ? 'Primaria' : 'Secundaria', matriculados: l.filter((e) => e.status === 'matriculado').length, pendientes: l.filter((e) => e.status === 'pendiente').length, retirados: l.filter((e) => e.status === 'retirado').length }
      })
      return { title: `Estudiantes por nivel · ${year.year}`, columns: cols({ key: 'nivel', label: 'Nivel' }, { key: 'matriculados', label: 'Matriculados', align: 'right' }, { key: 'pendientes', label: 'Pendientes', align: 'right' }, { key: 'retirados', label: 'Retirados', align: 'right' }), rows, chart: { type: 'bar', x: 'nivel', series: [{ key: 'matriculados', label: 'Matriculados' }, { key: 'pendientes', label: 'Pendientes' }, { key: 'retirados', label: 'Retirados' }] } }
    }
    case 'ac-grado': {
      const rows = [...d.grades].sort((a, b) => a.order - b.order).filter((g) => !f.levelId || g.levelId === f.levelId).map((g) => ({ grado: g.name, matriculados: enrs.filter((e) => e.gradeId === g.id && e.status === 'matriculado').length, pendientes: enrs.filter((e) => e.gradeId === g.id && e.status === 'pendiente').length }))
      return { title: `Estudiantes por grado · ${year.year}`, columns: cols({ key: 'grado', label: 'Grado' }, { key: 'matriculados', label: 'Matriculados', align: 'right' }, { key: 'pendientes', label: 'Pendientes', align: 'right' }), rows, chart: { type: 'bar', x: 'grado', series: [{ key: 'matriculados', label: 'Matriculados' }, { key: 'pendientes', label: 'Pendientes' }] } }
    }
    case 'ac-anio': {
      const rows = [...d.academicYears].sort((a, b) => a.year - b.year).map((y) => { const l = d.enrollments.filter((e) => e.yearId === y.id); return { anio: String(y.year), total: l.length, matriculados: l.filter((e) => e.status === 'matriculado').length, finalizadas: l.filter((e) => e.status === 'finalizado').length, retiradas: l.filter((e) => e.status === 'retirado').length, anuladas: l.filter((e) => e.status === 'anulado').length } })
      return { title: 'Matrículas por año académico', columns: cols({ key: 'anio', label: 'Año' }, { key: 'total', label: 'Total', align: 'right' }, { key: 'matriculados', label: 'Matriculados', align: 'right' }, { key: 'finalizadas', label: 'Finalizadas', align: 'right' }, { key: 'retiradas', label: 'Retiradas', align: 'right' }, { key: 'anuladas', label: 'Anuladas', align: 'right' }), rows, chart: { type: 'bar', x: 'anio', series: [{ key: 'total', label: 'Total' }] } }
    }
    case 'ac-seccion': {
      const rows = d.sections.filter((s) => s.yearId === year.id && lvlOk(s.gradeId)).map((s) => { const o = enrs.filter((e) => e.sectionId === s.id && (e.status === 'matriculado' || e.status === 'pendiente')).length; return { seccion: `${grade(s.gradeId).short} · ${s.name}`, capacidad: s.capacity, ocupadas: o, vacantes: s.capacity - o, ocupacion: `${Math.round((o / s.capacity) * 100)}%` } })
      return { title: `Matrículas por sección · ${year.year}`, columns: cols({ key: 'seccion', label: 'Sección' }, { key: 'capacidad', label: 'Capacidad', align: 'right' }, { key: 'ocupadas', label: 'Ocupadas', align: 'right' }, { key: 'vacantes', label: 'Vacantes', align: 'right' }, { key: 'ocupacion', label: 'Ocupación', align: 'right' }), rows, chart: { type: 'bar', x: 'seccion', series: [{ key: 'ocupadas', label: 'Ocupadas' }, { key: 'vacantes', label: 'Vacantes' }] } }
    }
    case 'ac-retirados': {
      const rows = d.enrollments.filter((e) => e.status === 'retirado' && lvlOk(e.gradeId)).map((e) => { const ev = [...e.events].reverse().find((x) => x.status === 'retirado'); return { estudiante: fullName(stu(e.studentId)), dni: stu(e.studentId).dni, grado: grade(e.gradeId).name, anio: String(d.academicYears.find((y) => y.id === e.yearId)!.year), fecha: ev?.at.slice(0, 10) ?? '—', motivo: ev?.note ?? '—' } })
      return { title: 'Estudiantes retirados', columns: cols({ key: 'estudiante', label: 'Estudiante' }, { key: 'dni', label: 'DNI' }, { key: 'grado', label: 'Grado' }, { key: 'anio', label: 'Año' }, { key: 'fecha', label: 'Fecha de retiro' }, { key: 'motivo', label: 'Motivo' }), rows }
    }
    case 'ac-historial': {
      const rows = d.enrollments.filter((e) => (!f.studentId || e.studentId === f.studentId) && lvlOk(e.gradeId)).sort((a, b) => stu(a.studentId).paternalSurname.localeCompare(stu(b.studentId).paternalSurname) || a.yearId.localeCompare(b.yearId)).map((e) => ({ estudiante: fullName(stu(e.studentId)), anio: String(d.academicYears.find((y) => y.id === e.yearId)!.year), grado: grade(e.gradeId).name, seccion: d.sections.find((s) => s.id === e.sectionId)!.name, estado: e.status, codigo: e.code }))
      return { title: 'Historial de matrícula', columns: cols({ key: 'estudiante', label: 'Estudiante' }, { key: 'anio', label: 'Año' }, { key: 'grado', label: 'Grado' }, { key: 'seccion', label: 'Sección' }, { key: 'estado', label: 'Estado' }, { key: 'codigo', label: 'Código' }), rows }
    }
    case 'ec-mensual': {
      const rows = monthlyIncome(year.year).map((m) => ({ mes: m.month, total: m.total }))
      return { title: `Ingresos mensuales · ${year.year}`, columns: cols({ key: 'mes', label: 'Mes' }, { key: 'total', label: 'Ingresos', align: 'right', money: true }), rows, chart: { type: 'bar', x: 'mes', series: [{ key: 'total', label: 'Ingresos' }] }, totals: { total: round2(rows.reduce((a, r) => a + r.total, 0)) } }
    }
    case 'ec-concepto': {
      const ids = new Map(d.obligations.map((o) => [o.id, o]))
      const sum = { matricula: 0, mensualidad: 0 }
      const confirmed = new Set(d.payments.filter((p) => p.status === 'confirmado').map((p) => p.id))
      for (const det of d.paymentDetails) { if (!confirmed.has(det.paymentId)) continue; const o = ids.get(det.obligationId); if (o && o.yearId === year.id) sum[o.concept] += det.amount }
      const rows = [{ concepto: 'Matrícula', total: round2(sum.matricula) }, { concepto: 'Mensualidades', total: round2(sum.mensualidad) }]
      return { title: `Ingresos por concepto · ${year.year}`, columns: cols({ key: 'concepto', label: 'Concepto' }, { key: 'total', label: 'Ingresos', align: 'right', money: true }), rows, chart: { type: 'pie', x: 'concepto', series: [{ key: 'total', label: 'Ingresos' }] }, totals: { total: round2(sum.matricula + sum.mensualidad) } }
    }
    case 'ec-pagos': {
      const rows = paymentRows((p) => (!f.method || p.method === f.method) && d.enrollments.find((e) => e.id === p.enrollmentId)?.yearId === year.id).map((p) => ({ comprobante: p.code, fecha: p.date, estudiante: p.studentName, metodo: p.method, importe: p.total, estado: p.status }))
      return { title: `Pagos registrados · ${year.year}`, columns: cols({ key: 'comprobante', label: 'Comprobante' }, { key: 'fecha', label: 'Fecha' }, { key: 'estudiante', label: 'Estudiante' }, { key: 'metodo', label: 'Método' }, { key: 'importe', label: 'Importe', align: 'right', money: true }, { key: 'estado', label: 'Estado' }), rows, totals: { importe: round2(rows.filter((r) => r.estado === 'confirmado').reduce((a, r) => a + (r.importe as number), 0)) } }
    }
    case 'ec-pendientes': {
      const by = new Map<string, { periodo: string; cuotas: number; saldo: number }>()
      allViews.filter((v) => v.concept === 'mensualidad' && v.balance > 0).forEach((v) => { const r = by.get(v.period) ?? { periodo: v.period, cuotas: 0, saldo: 0 }; r.cuotas++; r.saldo += v.balance; by.set(v.period, r) })
      const rows = [...by.values()].sort((a, b) => a.periodo.localeCompare(b.periodo)).map((r) => ({ ...r, saldo: round2(r.saldo) }))
      return { title: `Mensualidades pendientes · ${year.year}`, columns: cols({ key: 'periodo', label: 'Periodo' }, { key: 'cuotas', label: 'Cuotas', align: 'right' }, { key: 'saldo', label: 'Saldo pendiente', align: 'right', money: true }), rows, chart: { type: 'bar', x: 'periodo', series: [{ key: 'saldo', label: 'Saldo' }] }, totals: { saldo: round2(rows.reduce((a, r) => a + r.saldo, 0)) } }
    }
    case 'ec-vencidas': {
      const rows = allViews.filter((v) => v.overdue && (!f.levelId || grade(d.enrollments.find((e) => e.id === v.enrollmentId)!.gradeId).levelId === f.levelId)).map((v) => ({ estudiante: fullName(stu(v.studentId)), concepto: v.label, vencimiento: v.dueDate, dias: v.daysOverdue, saldo: v.balance })).sort((a, b) => b.dias - a.dias)
      return { title: `Deudas vencidas · ${year.year}`, columns: cols({ key: 'estudiante', label: 'Estudiante' }, { key: 'concepto', label: 'Concepto' }, { key: 'vencimiento', label: 'Vencimiento' }, { key: 'dias', label: 'Días', align: 'right' }, { key: 'saldo', label: 'Saldo', align: 'right', money: true }), rows, totals: { saldo: round2(rows.reduce((a, r) => a + r.saldo, 0)) } }
    }
    case 'ec-anual': {
      const rows = [...d.academicYears].sort((a, b) => a.year - b.year).map((y) => { const v = toViews(d, d.obligations.filter((o) => o.yearId === y.id && !o.annulled)); const esp = v.reduce((a, x) => a + x.amount, 0); const rec = v.reduce((a, x) => a + x.paid, 0); return { anio: String(y.year), esperado: round2(esp), recaudado: round2(rec), pendiente: round2(esp - rec) } }).filter((r) => r.esperado > 0)
      return { title: 'Recaudación por año académico', columns: cols({ key: 'anio', label: 'Año' }, { key: 'esperado', label: 'Esperado', align: 'right', money: true }, { key: 'recaudado', label: 'Recaudado', align: 'right', money: true }, { key: 'pendiente', label: 'Pendiente', align: 'right', money: true }), rows, chart: { type: 'bar', x: 'anio', series: [{ key: 'recaudado', label: 'Recaudado' }, { key: 'pendiente', label: 'Pendiente' }] } }
    }
    case 'ec-estado-cuenta': {
      const rows = d.students.filter((s) => !f.studentId || s.id === f.studentId).map((s) => { const v = toViews(d, d.obligations.filter((o) => o.studentId === s.id && o.yearId === year.id && !o.annulled)); return { estudiante: fullName(s), dni: s.dni, total: round2(v.reduce((a, x) => a + x.amount, 0)), pagado: round2(v.reduce((a, x) => a + x.paid, 0)), saldo: round2(v.reduce((a, x) => a + x.balance, 0)), vencido: round2(v.filter((x) => x.overdue).reduce((a, x) => a + x.balance, 0)) } }).filter((r) => r.total > 0).sort((a, b) => b.vencido - a.vencido)
      return { title: `Estado de cuenta por estudiante · ${year.year}`, columns: cols({ key: 'estudiante', label: 'Estudiante' }, { key: 'dni', label: 'DNI' }, { key: 'total', label: 'Total', align: 'right', money: true }, { key: 'pagado', label: 'Pagado', align: 'right', money: true }, { key: 'saldo', label: 'Saldo', align: 'right', money: true }, { key: 'vencido', label: 'Vencido', align: 'right', money: true }), rows }
    }
  }
}

export const reportService = {
  run(id: ReportId, f: ReportFilters = {}): Promise<ReportResult> { return delay(() => clone(build(id, f)), 600) },
}
