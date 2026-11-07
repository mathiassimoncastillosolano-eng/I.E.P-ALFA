import type { AuditModule, EnrollmentStatus, ObligationStatus, PaymentMethod, Permission, RoleId, StudentStatus } from '@/types'

/** Fecha simulada del sistema: todas las derivaciones (vencidas, programadas) se calculan contra ella. */
export const SIM_TODAY = '2026-11-07'
export const CURRENT_YEAR = 2026
export const DB_STORAGE_KEY = 'iep-alfa:db:v1'
export const DB_VERSION = 1

export const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

export const LEVEL_LABEL = { primaria: 'Primaria', secundaria: 'Secundaria' } as const

export const ENROLLMENT_STATUS_LABEL: Record<EnrollmentStatus, string> = {
  pendiente: 'Pendiente', matriculado: 'Matriculado', retirado: 'Retirado', anulado: 'Anulado', finalizado: 'Finalizado',
}
/** Transiciones válidas de matrícula. */
export const ENROLLMENT_TRANSITIONS: Record<EnrollmentStatus, EnrollmentStatus[]> = {
  pendiente: ['matriculado', 'anulado'],
  matriculado: ['retirado', 'anulado', 'finalizado'],
  retirado: [],
  anulado: [],
  finalizado: [],
}
export const STUDENT_STATUS_LABEL: Record<StudentStatus, string> = { activo: 'Activo', inactivo: 'Inactivo', retirado: 'Retirado' }
export const OBLIGATION_STATUS_LABEL: Record<ObligationStatus, string> = {
  programada: 'Programada', pendiente: 'Pendiente', parcial: 'Parcial', vencida: 'Vencida', pagada: 'Pagada', anulada: 'Anulada',
}
export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  efectivo: 'Efectivo', transferencia: 'Transferencia bancaria', yape: 'Yape', plin: 'Plin', otros: 'Otros',
}
export const ROLE_LABEL: Record<RoleId, string> = {
  administrador: 'Administrador', direccion: 'Dirección', secretaria: 'Secretaría', tesoreria: 'Tesorería',
}
export const MODULE_LABEL: Record<AuditModule, string> = {
  estudiantes: 'Estudiantes', matriculas: 'Matrículas', academico: 'Académico', pagos: 'Pagos',
  economico: 'Económico', usuarios: 'Usuarios', configuracion: 'Configuración', sistema: 'Sistema',
}
export const ROLE_PERMISSIONS: Record<RoleId, Permission[]> = {
  administrador: ['students.write','enrollments.write','enrollments.cancel','payments.write','payments.void','academic.write','settings.write','users.write','audit.read','reports.read','finance.read'],
  direccion: ['audit.read','reports.read','finance.read','enrollments.cancel','academic.write'],
  secretaria: ['students.write','enrollments.write','reports.read'],
  tesoreria: ['payments.write','payments.void','finance.read','reports.read'],
}
export const GRADE_DEFS = [
  ...['Primero','Segundo','Tercero','Cuarto','Quinto','Sexto'].map((n, i) => ({ id: `g-p${i + 1}`, levelId: 'primaria' as const, name: `${n} de primaria`, short: `${i + 1}° Prim.`, order: i + 1 })),
  ...['Primero','Segundo','Tercero','Cuarto','Quinto'].map((n, i) => ({ id: `g-s${i + 1}`, levelId: 'secundaria' as const, name: `${n} de secundaria`, short: `${i + 1}° Sec.`, order: 7 + i })),
]
