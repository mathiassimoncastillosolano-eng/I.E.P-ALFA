import type { Enrollment, Guardian, Student, StudentRow, StudentStatus } from '@/types'
import type { StudentFormValues } from '@/schemas'
import { studentSchema } from '@/schemas'
import { ApiError, clone, commit, db, delay, logAudit, nextCode, nextId } from './db'
import { toViews } from './domain'
import { fullName } from '@/utils/format'

export interface StudentFilters { q?: string; levelId?: string; gradeId?: string; sectionName?: string; status?: StudentStatus | ''; yearId?: string }

/** Matrícula "vigente" del estudiante: del año filtrado, o del año activo, o la más reciente. */
export function currentEnrollment(studentId: string, yearId?: string): Enrollment | undefined {
  const d = db()
  const list = d.enrollments.filter((e) => e.studentId === studentId && e.status !== 'anulado')
  const years = new Map(d.academicYears.map((y) => [y.id, y]))
  if (yearId) return list.find((e) => e.yearId === yearId)
  const active = list.find((e) => years.get(e.yearId)?.status === 'activo')
  return active ?? [...list].sort((a, b) => (years.get(b.yearId)?.year ?? 0) - (years.get(a.yearId)?.year ?? 0))[0]
}

export function buildStudentRow(s: Student, yearId?: string): StudentRow {
  const d = db()
  const g = d.guardians.find((x) => x.id === s.guardianId)
  const enr = currentEnrollment(s.id, yearId)
  const grade = enr ? d.grades.find((x) => x.id === enr.gradeId) : null
  const sec = enr ? d.sections.find((x) => x.id === enr.sectionId) : null
  const debt = toViews(d, d.obligations.filter((o) => o.studentId === s.id)).filter((v) => v.overdue).reduce((a, v) => a + v.balance, 0)
  return {
    ...s, fullName: fullName(s), guardianName: g ? `${g.names} ${g.surnames}` : '—', guardianPhone: g?.phone ?? '',
    gradeName: grade?.name ?? null, levelId: grade?.levelId ?? null, sectionName: sec?.name ?? null, gradeId: grade?.id ?? null, sectionId: sec?.id ?? null,
    enrollmentStatus: enr?.status ?? null, debt,
  }
}

function upsertGuardian(v: StudentFormValues['guardian'], existingId?: string): Guardian {
  const d = db()
  const byDni = d.guardians.find((g) => g.dni === v.dni)
  const target = (existingId ? d.guardians.find((g) => g.id === existingId) : undefined) ?? byDni
  if (target) {
    if (byDni && byDni.id !== target.id) return Object.assign(byDni, v)
    return Object.assign(target, v)
  }
  const g: Guardian = { id: nextId('gd'), ...v }
  d.guardians.push(g)
  return g
}

export const studentService = {
  list(f: StudentFilters = {}): Promise<StudentRow[]> {
    return delay(() => {
      const q = f.q?.toLowerCase().trim()
      return db().students.map((s) => buildStudentRow(s, f.yearId))
        .filter((r) => !f.status || r.status === f.status)
        .filter((r) => !f.levelId || r.levelId === f.levelId)
        .filter((r) => !f.gradeId || r.gradeId === f.gradeId)
        .filter((r) => !f.sectionName || r.sectionName === f.sectionName)
        .filter((r) => !q || r.dni.includes(q) || r.fullName.toLowerCase().includes(q) || r.code.toLowerCase().includes(q))
    })
  },
  get(id: string): Promise<{ student: StudentRow; raw: Student; guardian: Guardian }> {
    return delay(() => {
      const s = db().students.find((x) => x.id === id)
      if (!s) throw new ApiError('Estudiante no encontrado', 'NOT_FOUND')
      return clone({ student: buildStudentRow(s), raw: s, guardian: db().guardians.find((g) => g.id === s.guardianId)! })
    }, 200)
  },
  search(q: string): Promise<StudentRow[]> {
    return delay(() => {
      const t = q.toLowerCase().trim()
      if (!t) return []
      return db().students.map((s) => buildStudentRow(s)).filter((r) => r.dni.includes(t) || r.fullName.toLowerCase().includes(t) || r.code.toLowerCase().includes(t)).slice(0, 8)
    }, 150)
  },
  create(values: StudentFormValues): Promise<Student> {
    return delay(() => {
      const parsed = studentSchema.safeParse(values)
      if (!parsed.success) throw new ApiError(parsed.error.issues[0].message)
      const v = parsed.data
      const d = db()
      if (d.students.some((s) => s.dni === v.dni)) throw new ApiError(`Ya existe un estudiante con DNI ${v.dni}`, 'DUPLICATE')
      const g = upsertGuardian(v.guardian)
      const { guardian: _g, ...rest } = v
      void _g
      const s: Student = { id: nextId('st'), code: nextCode('EST', 4), ...rest, guardianId: g.id, status: 'activo', createdAt: new Date().toISOString().slice(0, 10) }
      d.students.push(s)
      logAudit('crear', 'estudiantes', `Registró al estudiante ${fullName(s)}`, s.code)
      commit()
      return clone(s)
    }, 500)
  },
  update(id: string, values: StudentFormValues): Promise<Student> {
    return delay(() => {
      const parsed = studentSchema.safeParse(values)
      if (!parsed.success) throw new ApiError(parsed.error.issues[0].message)
      const v = parsed.data
      const d = db()
      const s = d.students.find((x) => x.id === id)
      if (!s) throw new ApiError('Estudiante no encontrado', 'NOT_FOUND')
      if (d.students.some((x) => x.dni === v.dni && x.id !== id)) throw new ApiError(`Ya existe otro estudiante con DNI ${v.dni}`, 'DUPLICATE')
      const g = upsertGuardian(v.guardian, s.guardianId)
      const { guardian: _g, ...rest } = v
      void _g
      Object.assign(s, rest, { guardianId: g.id })
      logAudit('editar', 'estudiantes', `Editó los datos de ${fullName(s)}`, s.code)
      commit()
      return clone(s)
    }, 450)
  },
  setStatus(id: string, status: StudentStatus): Promise<Student> {
    return delay(() => {
      const s = db().students.find((x) => x.id === id)
      if (!s) throw new ApiError('Estudiante no encontrado', 'NOT_FOUND')
      if (status === 'activo' && s.status === 'retirado') {
        // reactivar permitido: queda disponible para nueva matrícula
      }
      s.status = status
      logAudit('editar', 'estudiantes', `Cambió el estado de ${fullName(s)} a ${status}`, s.code)
      commit()
      return clone(s)
    })
  },
  /** Los estudiantes con historial no se eliminan físicamente. */
  remove(id: string): Promise<never> {
    return delay(() => {
      const has = db().enrollments.some((e) => e.studentId === id) || db().payments.some((p) => p.studentId === id)
      throw new ApiError(has ? 'No se puede eliminar un estudiante con historial académico o económico. Use el estado Inactivo o Retirado.' : 'La eliminación física no está habilitada en esta versión.', 'FORBIDDEN')
    }, 150)
  },
  existsDni(dni: string, excludeId?: string): boolean {
    return db().students.some((s) => s.dni === dni && s.id !== excludeId)
  },
}
