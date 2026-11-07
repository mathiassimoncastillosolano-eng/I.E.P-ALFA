export type LevelId = 'primaria' | 'secundaria'
export type Sex = 'M' | 'F'
export type StudentStatus = 'activo' | 'inactivo' | 'retirado'
export type EnrollmentStatus = 'pendiente' | 'matriculado' | 'retirado' | 'anulado' | 'finalizado'
export type YearStatus = 'planificado' | 'activo' | 'cerrado'
export type SectionStatus = 'abierta' | 'cerrada'
export type ObligationConcept = 'matricula' | 'mensualidad'
export type ObligationStatus = 'programada' | 'pendiente' | 'parcial' | 'vencida' | 'pagada' | 'anulada'
export type PaymentMethod = 'efectivo' | 'transferencia' | 'yape' | 'plin' | 'otros'
export type PaymentStatus = 'confirmado' | 'anulado'
export type RoleId = 'administrador' | 'direccion' | 'secretaria' | 'tesoreria'
export type AuditModule =
  | 'estudiantes' | 'matriculas' | 'academico' | 'pagos' | 'economico' | 'usuarios' | 'configuracion' | 'sistema'
export type AuditAction = 'crear' | 'editar' | 'retirar' | 'anular' | 'reversar' | 'finalizar' | 'configurar' | 'restablecer'

export interface Level { id: LevelId; name: string }
export interface Grade { id: string; levelId: LevelId; name: string; short: string; order: number }

export interface EconomicConfig {
  matriculaAmount: number
  mensualidadAmount: number
  installments: number
  startMonth: number // 1-12
  dueDay: number
  matriculaDueDate: string // ISO yyyy-MM-dd
  defaultDiscountPct: number
}

export interface AcademicYear {
  id: string
  year: number
  status: YearStatus
  startDate: string
  endDate: string
  config: EconomicConfig
}

export interface Section {
  id: string
  yearId: string
  gradeId: string
  name: string
  capacity: number
  status: SectionStatus
}

export interface Guardian {
  id: string
  dni: string
  names: string
  surnames: string
  relationship: string
  phone: string
  email: string
  address: string
}

export interface Student {
  id: string
  code: string
  dni: string
  names: string
  paternalSurname: string
  maternalSurname: string
  birthDate: string
  sex: Sex
  address: string
  phone: string
  email: string
  photo?: string
  status: StudentStatus
  guardianId: string
  notes: string
  createdAt: string
}

export interface EnrollmentEvent { at: string; status: EnrollmentStatus; note: string; userId: string }

export interface Enrollment {
  id: string
  code: string
  studentId: string
  yearId: string
  gradeId: string
  sectionId: string
  status: EnrollmentStatus
  enrolledAt: string
  matriculaAmount: number
  mensualidadAmount: number
  installments: number
  discountPct: number
  conditions: string
  events: EnrollmentEvent[]
}

export interface Obligation {
  id: string
  enrollmentId: string
  studentId: string
  yearId: string
  concept: ObligationConcept
  period: string // 'matricula' | yyyy-MM
  label: string
  amount: number
  dueDate: string
  annulled: boolean
}

export interface Payment {
  id: string
  code: string
  studentId: string
  enrollmentId: string
  date: string
  method: PaymentMethod
  operationNumber: string
  total: number
  notes: string
  status: PaymentStatus
  userId: string
  voidReason?: string
  voidedAt?: string
  voidedBy?: string
}

export interface PaymentDetail { id: string; paymentId: string; obligationId: string; amount: number }

export interface AuditEvent {
  id: string
  at: string // ISO datetime
  userId: string
  userName: string
  action: AuditAction
  module: AuditModule
  description: string
  entity: string
}

export interface User {
  id: string
  name: string
  email: string
  role: RoleId
  active: boolean
  lastAccess: string
}

export interface Institution {
  name: string
  shortName: string
  ugel: string
  address: string
  phone: string
  email: string
  director: string
  currency: string
}

export interface Database {
  version: number
  academicYears: AcademicYear[]
  grades: Grade[]
  sections: Section[]
  guardians: Guardian[]
  students: Student[]
  enrollments: Enrollment[]
  obligations: Obligation[]
  payments: Payment[]
  paymentDetails: PaymentDetail[]
  audit: AuditEvent[]
  users: User[]
  institution: Institution
  currentUserId: string
  counters: Record<string, number>
}

/* ---------- Vistas derivadas ---------- */
export interface ObligationView extends Obligation {
  paid: number
  balance: number
  status: ObligationStatus
  overdue: boolean
  daysOverdue: number
}

export interface StudentRow extends Student {
  fullName: string
  guardianName: string
  guardianPhone: string
  gradeName: string | null
  levelId: LevelId | null
  sectionName: string | null
  gradeId: string | null
  sectionId: string | null
  enrollmentStatus: EnrollmentStatus | null
  debt: number
}

export interface EnrollmentRow extends Enrollment {
  studentName: string
  studentDni: string
  studentCode: string
  year: number
  gradeName: string
  levelId: LevelId
  sectionName: string
  total: number
  paid: number
  balance: number
}

export interface AccountSummary {
  total: number
  paid: number
  pending: number
  overdue: number
  upcoming: ObligationView[]
}

export interface DebtRow extends ObligationView {
  studentName: string
  studentDni: string
  gradeName: string
  sectionName: string
  levelId: LevelId
  year: number
}

export interface PaymentRow extends Payment {
  studentName: string
  studentDni: string
  year: number
  gradeName: string
  details: (PaymentDetail & { label: string })[]
}

export interface PermissionSet {
  can: (perm: Permission) => boolean
}
export type Permission =
  | 'students.write' | 'enrollments.write' | 'enrollments.cancel' | 'payments.write' | 'payments.void'
  | 'academic.write' | 'settings.write' | 'users.write' | 'audit.read' | 'reports.read' | 'finance.read'
