import type { Enrollment, EnrollmentRow, EnrollmentStatus, Obligation } from '@/types'
import { ENROLLMENT_STATUS_LABEL, ENROLLMENT_TRANSITIONS, SIM_TODAY } from '@/constants'
import { buildObligations } from '@/mocks/seeds/generate'
import { economicSchema } from '@/schemas'
import { ApiError, clone, commit, db, delay, logAudit, nextCode, nextId, currentUser } from './db'
import { toViews } from './domain'
import { sectionOccupancy } from './academicService'
import { fullName } from '@/utils/format'

export interface EnrollmentFilters { q?: string; yearId?: string; levelId?: string; gradeId?: string; sectionId?: string; status?: EnrollmentStatus | ''; studentId?: string }

export interface CreateEnrollmentInput {
  studentId: string; yearId: string; gradeId: string; sectionId: string
  matriculaAmount: number; mensualidadAmount: number; installments: number; discountPct: number; conditions: string
  status: 'pendiente' | 'matriculado'
}

function toRow(e: Enrollment): EnrollmentRow {
  const d = db()
  const s = d.students.find((x) => x.id === e.studentId)!
  const g = d.grades.find((x) => x.id === e.gradeId)!
  const sec = d.sections.find((x) => x.id === e.sectionId)!
  const y = d.academicYears.find((x) => x.id === e.yearId)!
  const views = toViews(d, d.obligations.filter((o) => o.enrollmentId === e.id))
  const live = views.filter((v) => !v.annulled)
  return {
    ...e, studentName: fullName(s), studentDni: s.dni, studentCode: s.code, year: y.year, gradeName: g.name, levelId: g.levelId, sectionName: sec.name,
    total: live.reduce((a, v) => a + v.amount, 0), paid: live.reduce((a, v) => a + v.paid, 0), balance: live.reduce((a, v) => a + v.balance, 0),
  }
}

function pushEvent(e: Enrollment, status: EnrollmentStatus, note: string) {
  e.events.push({ at: new Date().toISOString().slice(0, 19), status, note, userId: currentUser().id })
}

function generateMonthlies(e: Enrollment, existing: Obligation[]) {
  const d = db()
  const y = d.academicYears.find((x) => x.id === e.yearId)!
  const all = buildObligations(e, y, () => nextId('ob'))
  // Solo se cobran los periodos desde el mes de matrícula (no se generan cuotas retroactivas).
  const months = all.filter((o) => o.concept === 'mensualidad' && o.period >= e.enrolledAt.slice(0, 7))
  const have = new Set(existing.map((o) => o.period))
  const created = months.filter((o) => !have.has(o.period))
  d.obligations.push(...created)
  return created
}

export const enrollmentService = {
  list(f: EnrollmentFilters = {}): Promise<EnrollmentRow[]> {
    return delay(() => {
      const q = f.q?.toLowerCase().trim()
      return db().enrollments.map(toRow)
        .filter((r) => !f.yearId || r.yearId === f.yearId)
        .filter((r) => !f.levelId || r.levelId === f.levelId)
        .filter((r) => !f.gradeId || r.gradeId === f.gradeId)
        .filter((r) => !f.sectionId || r.sectionId === f.sectionId)
        .filter((r) => !f.status || r.status === f.status)
        .filter((r) => !f.studentId || r.studentId === f.studentId)
        .filter((r) => !q || r.studentName.toLowerCase().includes(q) || r.studentDni.includes(q) || r.code.toLowerCase().includes(q))
        .sort((a, b) => b.year - a.year || b.enrolledAt.localeCompare(a.enrolledAt))
    })
  },
  get(id: string): Promise<EnrollmentRow> {
    return delay(() => {
      const e = db().enrollments.find((x) => x.id === id)
      if (!e) throw new ApiError('Matrícula no encontrada', 'NOT_FOUND')
      return clone(toRow(e))
    }, 200)
  },
  /** Verificación para el asistente: duplicado en el año. */
  findDuplicate(studentId: string, yearId: string): Enrollment | undefined {
    return db().enrollments.find((e) => e.studentId === studentId && e.yearId === yearId && e.status !== 'anulado')
  },
  create(input: CreateEnrollmentInput): Promise<EnrollmentRow> {
    return delay(() => {
      const d = db()
      const student = d.students.find((s) => s.id === input.studentId)
      if (!student) throw new ApiError('Estudiante no encontrado', 'NOT_FOUND')
      const year = d.academicYears.find((y) => y.id === input.yearId)
      if (!year) throw new ApiError('Año académico no válido')
      if (year.status === 'cerrado') throw new ApiError('No se pueden registrar matrículas en un año cerrado')
      if (this.findDuplicate(input.studentId, input.yearId)) throw new ApiError(`${fullName(student)} ya tiene una matrícula vigente en ${year.year}`, 'DUPLICATE')
      const sec = d.sections.find((s) => s.id === input.sectionId)
      if (!sec || sec.gradeId !== input.gradeId || sec.yearId !== input.yearId) throw new ApiError('La sección no corresponde al grado y año seleccionados')
      if (sec.status !== 'abierta') throw new ApiError('La sección seleccionada está cerrada')
      if (sectionOccupancy(sec.id) >= sec.capacity) throw new ApiError('La sección no tiene vacantes disponibles', 'NO_VACANCY')
      const eco = economicSchema.safeParse(input)
      if (!eco.success) throw new ApiError(eco.error.issues[0].message)
      const e: Enrollment = {
        id: nextId('enr'), code: nextCode(`MAT-${year.year}`, 4), studentId: input.studentId, yearId: input.yearId, gradeId: input.gradeId, sectionId: input.sectionId,
        status: input.status, enrolledAt: SIM_TODAY, matriculaAmount: input.matriculaAmount, mensualidadAmount: input.mensualidadAmount,
        installments: input.installments, discountPct: input.discountPct, conditions: input.conditions, events: [],
      }
      pushEvent(e, input.status, input.status === 'pendiente' ? 'Matrícula registrada, pendiente de pago de matrícula' : 'Matrícula confirmada')
      d.enrollments.push(e)
      const all = buildObligations(e, year, () => nextId('ob'))
      const billable = all
        .filter((o) => o.concept === 'matricula' || o.period >= e.enrolledAt.slice(0, 7))
        .map((o) => (o.concept === 'matricula' && o.dueDate < e.enrolledAt ? { ...o, dueDate: e.enrolledAt } : o))
      d.obligations.push(...(input.status === 'pendiente' ? billable.filter((o) => o.concept === 'matricula') : billable))
      if (student.status !== 'activo') student.status = 'activo'
      logAudit('crear', 'matriculas', `Registró la matrícula ${e.code} de ${fullName(student)}`, e.code)
      commit()
      return clone(toRow(e))
    }, 700)
  },
  update(id: string, patch: { sectionId?: string; conditions?: string }): Promise<EnrollmentRow> {
    return delay(() => {
      const d = db()
      const e = d.enrollments.find((x) => x.id === id)
      if (!e) throw new ApiError('Matrícula no encontrada', 'NOT_FOUND')
      if (e.status === 'anulado' || e.status === 'retirado' || e.status === 'finalizado') throw new ApiError('Una matrícula cerrada no puede modificarse')
      if (patch.sectionId && patch.sectionId !== e.sectionId) {
        const sec = d.sections.find((s) => s.id === patch.sectionId)
        if (!sec || sec.gradeId !== e.gradeId || sec.yearId !== e.yearId) throw new ApiError('La sección debe pertenecer al mismo grado y año')
        if (sec.status !== 'abierta') throw new ApiError('La sección está cerrada')
        if (sectionOccupancy(sec.id) >= sec.capacity) throw new ApiError('La sección no tiene vacantes')
        e.sectionId = sec.id
      }
      if (patch.conditions !== undefined) e.conditions = patch.conditions.slice(0, 300)
      logAudit('editar', 'matriculas', `Editó la matrícula ${e.code}`, e.code)
      commit()
      return clone(toRow(e))
    })
  },
  transition(id: string, to: EnrollmentStatus, note: string): Promise<EnrollmentRow> {
    return delay(() => {
      const d = db()
      const e = d.enrollments.find((x) => x.id === id)
      if (!e) throw new ApiError('Matrícula no encontrada', 'NOT_FOUND')
      if (!ENROLLMENT_TRANSITIONS[e.status].includes(to)) throw new ApiError(`No se puede pasar de ${ENROLLMENT_STATUS_LABEL[e.status]} a ${ENROLLMENT_STATUS_LABEL[to]}`, 'INVALID_TRANSITION')
      const student = d.students.find((s) => s.id === e.studentId)!
      const views = toViews(d, d.obligations.filter((o) => o.enrollmentId === e.id))
      const hasPayments = views.some((v) => v.paid > 0)

      if (to === 'matriculado') {
        const mat = views.find((v) => v.concept === 'matricula')
        if (!mat || mat.balance > 0) throw new ApiError('Para confirmar la matrícula debe estar pagado el concepto de matrícula')
        generateMonthlies(e, d.obligations.filter((o) => o.enrollmentId === e.id))
      }
      if (to === 'anulado') {
        if (hasPayments) throw new ApiError('La matrícula tiene pagos confirmados. Anule primero los pagos asociados.')
        d.obligations.filter((o) => o.enrollmentId === e.id).forEach((o) => { o.annulled = true })
      }
      if (to === 'retirado') {
        // Se anulan las cuotas futuras sin pagos; lo ya generado/pagado se conserva.
        views.filter((v) => v.dueDate > SIM_TODAY && v.paid === 0).forEach((v) => { d.obligations.find((o) => o.id === v.id)!.annulled = true })
        const others = d.enrollments.some((x) => x.studentId === e.studentId && x.id !== e.id && (x.status === 'matriculado' || x.status === 'pendiente'))
        if (!others) student.status = 'retirado'
      }
      e.status = to
      pushEvent(e, to, note || ENROLLMENT_STATUS_LABEL[to])
      const action = to === 'retirado' ? 'retirar' : to === 'anulado' ? 'anular' : to === 'finalizado' ? 'finalizar' : 'editar'
      logAudit(action, 'matriculas', `${ENROLLMENT_STATUS_LABEL[to]}: matrícula ${e.code} de ${fullName(student)}${note ? ` — ${note}` : ''}`, e.code)
      commit()
      return clone(toRow(e))
    }, 500)
  },
}
