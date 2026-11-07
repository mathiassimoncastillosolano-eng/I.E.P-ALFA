import { z } from 'zod'
import type { AcademicYear, EconomicConfig, Grade, Section, YearStatus } from '@/types'
import { ApiError, clone, commit, db, delay, logAudit } from './db'
import { economicSchema } from '@/schemas'
import { DEFAULT_CONFIG } from '@/mocks/seeds/generate'

export interface SectionView extends Section {
  gradeName: string
  levelId: Grade['levelId']
  year: number
  enrolled: number
  vacancies: number
}

export function sectionOccupancy(sectionId: string) {
  return db().enrollments.filter((e) => e.sectionId === sectionId && (e.status === 'pendiente' || e.status === 'matriculado')).length
}

export const academicService = {
  years(): Promise<AcademicYear[]> { return delay(() => clone(db().academicYears).sort((a, b) => b.year - a.year), 120) },
  grades(): Promise<Grade[]> { return delay(() => clone(db().grades).sort((a, b) => a.order - b.order), 80) },
  sections(yearId?: string): Promise<SectionView[]> {
    return delay(() => {
      const d = db()
      return d.sections.filter((s) => !yearId || s.yearId === yearId).map((s) => {
        const g = d.grades.find((x) => x.id === s.gradeId)!
        const y = d.academicYears.find((x) => x.id === s.yearId)!
        const enrolled = sectionOccupancy(s.id)
        return { ...s, gradeName: g.name, levelId: g.levelId, year: y.year, enrolled, vacancies: Math.max(0, s.capacity - enrolled) }
      }).sort((a, b) => a.gradeName.localeCompare(b.gradeName, 'es') || a.name.localeCompare(b.name))
    }, 200)
  },
  updateSection(id: string, patch: { capacity?: number; status?: Section['status'] }): Promise<Section> {
    return delay(() => {
      const s = db().sections.find((x) => x.id === id)
      if (!s) throw new ApiError('Sección no encontrada', 'NOT_FOUND')
      const occ = sectionOccupancy(id)
      if (patch.capacity !== undefined) {
        if (!Number.isInteger(patch.capacity) || patch.capacity < 1 || patch.capacity > 45) throw new ApiError('La capacidad debe estar entre 1 y 45')
        if (patch.capacity < occ) throw new ApiError(`La capacidad no puede ser menor a los ${occ} estudiantes matriculados`)
        s.capacity = patch.capacity
      }
      if (patch.status) {
        s.status = patch.status
      }
      logAudit('configurar', 'academico', `Actualizó la sección ${s.name} (${s.id})`, s.id)
      commit()
      return clone(s)
    })
  },
  createSection(yearId: string, gradeId: string, capacity: number): Promise<Section> {
    return delay(() => {
      const d = db()
      const existing = d.sections.filter((s) => s.yearId === yearId && s.gradeId === gradeId).map((s) => s.name)
      const name = String.fromCharCode(65 + existing.length)
      if (existing.length >= 6) throw new ApiError('Máximo 6 secciones por grado')
      const sec: Section = { id: `sec-${d.academicYears.find((y) => y.id === yearId)!.year}-${gradeId}-${name}`, yearId, gradeId, name, capacity, status: 'abierta' }
      d.sections.push(sec)
      logAudit('crear', 'academico', `Creó la sección ${name} de ${d.grades.find((g) => g.id === gradeId)?.name}`, sec.id)
      commit()
      return clone(sec)
    })
  },
  createYear(year: number): Promise<AcademicYear> {
    return delay(() => {
      const d = db()
      if (!Number.isInteger(year) || year < 2000 || year > 2100) throw new ApiError('Año no válido')
      if (d.academicYears.some((y) => y.year === year)) throw new ApiError(`El año académico ${year} ya existe`)
      const prev = [...d.academicYears].sort((a, b) => b.year - a.year)[0]
      const ay: AcademicYear = {
        id: `ay-${year}`, year, status: 'planificado', startDate: `${year}-03-09`, endDate: `${year}-12-18`,
        config: { ...(prev?.config ?? DEFAULT_CONFIG), matriculaDueDate: `${year}-03-06` },
      }
      d.academicYears.push(ay)
      for (const g of d.grades) for (const n of ['A', 'B']) d.sections.push({ id: `sec-${year}-${g.id}-${n}`, yearId: ay.id, gradeId: g.id, name: n, capacity: 30, status: 'abierta' })
      logAudit('crear', 'academico', `Creó el año académico ${year}`, ay.id)
      commit()
      return clone(ay)
    })
  },
  setYearStatus(id: string, status: YearStatus): Promise<AcademicYear> {
    return delay(() => {
      const d = db()
      const y = d.academicYears.find((x) => x.id === id)
      if (!y) throw new ApiError('Año académico no encontrado', 'NOT_FOUND')
      if (status === 'activo') d.academicYears.filter((x) => x.status === 'activo' && x.id !== id).forEach((x) => { x.status = 'cerrado' })
      y.status = status
      logAudit('configurar', 'academico', `Cambió el estado del año ${y.year} a ${status}`, y.id)
      commit()
      return clone(y)
    })
  },
  updateYearConfig(id: string, patch: Partial<EconomicConfig>): Promise<AcademicYear> {
    return delay(() => {
      const y = db().academicYears.find((x) => x.id === id)
      if (!y) throw new ApiError('Año académico no encontrado', 'NOT_FOUND')
      const next = { ...y.config, ...patch }
      const parsed = economicSchema.pick({ matriculaAmount: true, mensualidadAmount: true, installments: true }).safeParse(next)
      if (!parsed.success) throw new ApiError(parsed.error.issues[0].message)
      z.number().int().min(1).max(12).parse(next.startMonth)
      if (next.dueDay < 1 || next.dueDay > 28) throw new ApiError('El día de vencimiento debe estar entre 1 y 28')
      y.config = next
      logAudit('configurar', 'economico', `Modificó la configuración económica ${y.year} (aplica a nuevas matrículas)`, y.id)
      commit()
      return clone(y)
    })
  },
}
