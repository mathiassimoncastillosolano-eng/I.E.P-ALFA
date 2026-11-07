import { GRADE_DEFS, DB_VERSION } from '@/constants'
import type {
  AcademicYear, AuditEvent, Database, EconomicConfig, Enrollment, Guardian, Obligation, Payment, PaymentDetail,
  PaymentMethod, Section, Student, User,
} from '@/types'
import { MONTH_NAMES } from '@/constants'
import { SIM_TODAY } from '@/constants'

function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const MALE = ['Mateo','Santiago','Sebastián','Matías','Diego','Gabriel','Thiago','Leonardo','Daniel','Adrián','Bruno','Joaquín','Nicolás','Emiliano','Rodrigo','Renzo','Fabrizio','Álvaro','Gonzalo','Piero','Andrés','Ian','Luka','César']
const FEMALE = ['Valentina','Camila','Sofía','Isabella','Luciana','Mía','Fernanda','Antonella','Renata','Daniela','Ximena','Alessia','Rafaela','Catalina','Valeria','Mariana','Alejandra','Micaela','Jimena','Briana','Abigail','Nayeli','Zoe','Aitana']
const SURNAMES = ['Quispe','Huamán','Flores','Rojas','Mendoza','Chávez','Vargas','Castillo','Ramírez','Torres','Díaz','Gutiérrez','Salazar','Paredes','Cárdenas','Villanueva','Espinoza','Mamani','Sánchez','Rivera','Cabrera','Ponce','Herrera','Zegarra','Lozano','Arévalo','Campos','Delgado','Ortiz','Valdivia','Bustamante','Ccori']
const GUARDIAN_M = ['Carlos','Jorge','Luis','Ricardo','Manuel','Pedro','Julio','Héctor','Víctor','Eduardo','Raúl','Fernando']
const GUARDIAN_F = ['María','Rosa','Carmen','Patricia','Ana','Lucía','Silvia','Gladys','Elena','Milagros','Sandra','Karla']
const STREETS = ['Av. Los Álamos','Jr. Las Palmeras','Calle Los Pinos','Av. Primavera','Jr. San Martín','Calle Las Begonias','Av. Grau','Jr. Cusco','Calle Los Jazmines','Av. Universitaria']
const DISTRICTS = ['San Miguel','Los Olivos','Comas','San Juan de Lurigancho','Surco','Independencia','Ate','La Molina','Callao','Villa El Salvador']
const RELS = ['Madre','Padre','Tío/a','Abuelo/a','Tutor/a legal']

export const DEFAULT_CONFIG: EconomicConfig = {
  matriculaAmount: 300, mensualidadAmount: 280, installments: 10, startMonth: 3, dueDay: 5,
  matriculaDueDate: '', defaultDiscountPct: 0,
}

const pad = (n: number, l = 2) => String(n).padStart(l, '0')
const iso = (d: Date) => d.toISOString().slice(0, 10)

export function buildObligations(e: Pick<Enrollment, 'id' | 'studentId' | 'yearId' | 'matriculaAmount' | 'mensualidadAmount' | 'installments' | 'discountPct'>, year: AcademicYear, nextId: () => string): Obligation[] {
  const cfg = year.config
  const list: Obligation[] = []
  const disc = 1 - (e.discountPct || 0) / 100
  list.push({
    id: nextId(), enrollmentId: e.id, studentId: e.studentId, yearId: e.yearId, concept: 'matricula', period: 'matricula',
    label: `Matrícula ${year.year}`, amount: Math.round(e.matriculaAmount * 100) / 100, dueDate: cfg.matriculaDueDate, annulled: false,
  })
  for (let i = 0; i < e.installments; i++) {
    const m = cfg.startMonth + i
    const d = new Date(Date.UTC(year.year, m - 1, cfg.dueDay))
    const ym = `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`
    list.push({
      id: nextId(), enrollmentId: e.id, studentId: e.studentId, yearId: e.yearId, concept: 'mensualidad', period: ym,
      label: `Mensualidad ${MONTH_NAMES[d.getUTCMonth()]} ${year.year}`,
      amount: Math.round(e.mensualidadAmount * disc * 100) / 100, dueDate: iso(d), annulled: false,
    })
  }
  return list
}

export function generateSeed(): Database {
  const rnd = mulberry32(20260711)
  const pick = <T,>(a: T[]) => a[Math.floor(rnd() * a.length)]
  const counters: Record<string, number> = {}
  const next = (k: string) => { counters[k] = (counters[k] ?? 0) + 1; return counters[k] }
  const id = (k: string) => `${k}-${pad(next(k), 4)}`

  const mkYear = (year: number, status: AcademicYear['status'], amounts: [number, number]): AcademicYear => ({
    id: `ay-${year}`, year, status, startDate: `${year}-03-09`, endDate: `${year}-12-18`,
    config: { ...DEFAULT_CONFIG, matriculaAmount: amounts[0], mensualidadAmount: amounts[1], matriculaDueDate: `${year}-03-06` },
  })
  const academicYears = [mkYear(2025, 'cerrado', [280, 260]), mkYear(2026, 'activo', [300, 280]), mkYear(2027, 'planificado', [320, 300])]

  const grades = GRADE_DEFS.map((g) => ({ ...g }))
  const sections: Section[] = []
  for (const y of academicYears) for (const g of grades) for (const n of ['A', 'B']) {
    sections.push({ id: `sec-${y.year}-${g.id}-${n}`, yearId: y.id, gradeId: g.id, name: n, capacity: 30, status: 'abierta' })
  }

  const users: User[] = [
    { id: 'u-1', name: 'Marco Castillo', email: 'admin@iepalfa.edu.pe', role: 'administrador', active: true, lastAccess: `${SIM_TODAY}T08:10:00` },
    { id: 'u-2', name: 'Dra. Elena Paredes', email: 'direccion@iepalfa.edu.pe', role: 'direccion', active: true, lastAccess: `${SIM_TODAY}T07:45:00` },
    { id: 'u-3', name: 'Lucía Ramos', email: 'secretaria@iepalfa.edu.pe', role: 'secretaria', active: true, lastAccess: '2026-11-06T16:20:00' },
    { id: 'u-4', name: 'Jorge Salazar', email: 'tesoreria@iepalfa.edu.pe', role: 'tesoreria', active: true, lastAccess: '2026-11-06T17:05:00' },
  ]

  const guardians: Guardian[] = []
  const students: Student[] = []
  const enrollments: Enrollment[] = []
  const obligations: Obligation[] = []
  const payments: Payment[] = []
  const paymentDetails: PaymentDetail[] = []
  const audit: AuditEvent[] = []

  const dniBase = 70000000
  const N = 48
  const sectionCount: Record<string, number> = {}
  const year26 = academicYears[1]
  const year25 = academicYears[0]

  const logAudit = (at: string, u: User, action: AuditEvent['action'], module: AuditEvent['module'], description: string, entity: string) =>
    audit.push({ id: id('aud'), at, userId: u.id, userName: u.name, action, module, description, entity })

  const addPayment = (enr: Enrollment, obs: Obligation[], amount: number, date: string, method: PaymentMethod, user: User) => {
    let remaining = amount
    const pid = id('pay')
    const pay: Payment = {
      id: pid, code: `RC-${pad(next('rc'), 5)}`, studentId: enr.studentId, enrollmentId: enr.id, date, method,
      operationNumber: method === 'efectivo' ? '' : String(100000 + Math.floor(rnd() * 899999)),
      total: 0, notes: '', status: 'confirmado', userId: user.id,
    }
    for (const o of obs) {
      if (remaining <= 0) break
      const already = paymentDetails.filter((d) => d.obligationId === o.id).reduce((s, d) => s + d.amount, 0)
      const bal = Math.round((o.amount - already) * 100) / 100
      if (bal <= 0) continue
      const part = Math.min(bal, remaining)
      paymentDetails.push({ id: id('pd'), paymentId: pid, obligationId: o.id, amount: part })
      pay.total += part
      remaining = Math.round((remaining - part) * 100) / 100
    }
    pay.total = Math.round(pay.total * 100) / 100
    if (pay.total > 0) {
      payments.push(pay)
      logAudit(`${date}T${pad(9 + Math.floor(rnd() * 8))}:${pad(Math.floor(rnd() * 60))}:00`, user, 'crear', 'pagos', `Registró pago ${pay.code} por S/ ${pay.total.toFixed(2)}`, pay.code)
    }
  }

  for (let i = 0; i < N; i++) {
    const female = rnd() > 0.5
    const names = pick(female ? FEMALE : MALE)
    const pat = pick(SURNAMES)
    let mat = pick(SURNAMES); if (mat === pat) mat = pick(SURNAMES)
    const gIdx = Math.floor(rnd() * grades.length)
    const grade = grades[gIdx]
    const gOrder = gIdx
    const gAge = 6 + gOrder
    const birth = `${2026 - gAge}-${pad(1 + Math.floor(rnd() * 12))}-${pad(1 + Math.floor(rnd() * 27))}`

    const g: Guardian = {
      id: id('gd'), dni: String(40000000 + Math.floor(rnd() * 9000000) + i), names: pick(rnd() > 0.45 ? GUARDIAN_F : GUARDIAN_M),
      surnames: `${pat} ${pick(SURNAMES)}`, relationship: pick(RELS),
      phone: `9${Math.floor(10000000 + rnd() * 89999999)}`, email: `apoderado${i + 1}@correo-demo.pe`,
      address: `${pick(STREETS)} ${100 + Math.floor(rnd() * 800)}, ${pick(DISTRICTS)}`,
    }
    guardians.push(g)

    const withdrawn = i % 17 === 5
    const s: Student = {
      id: id('st'), code: `EST-${pad(i + 1, 4)}`, dni: String(dniBase + i * 137 + 11), names, paternalSurname: pat, maternalSurname: mat,
      birthDate: birth, sex: female ? 'F' : 'M', address: g.address, phone: g.phone, email: `alumno${i + 1}@correo-demo.pe`,
      status: withdrawn ? 'retirado' : 'activo', guardianId: g.id, notes: i % 9 === 0 ? 'Hermano/a de otro estudiante del colegio.' : '', createdAt: `2025-12-${pad(1 + (i % 28))}`,
    }
    students.push(s)
    const secretary = users[2]
    logAudit(`${s.createdAt}T10:${pad(i % 60)}:00`, secretary, 'crear', 'estudiantes', `Registró al estudiante ${names} ${pat} ${mat}`, s.code)

    // Matrícula 2025 (grado anterior) para estudiantes con grado > 1
    const prevGrade = gIdx > 0 && gIdx !== 6 && i % 3 !== 0 ? grades[gIdx - 1] : null
    if (prevGrade) {
      const secName = rnd() > 0.5 ? 'A' : 'B'
      const sec = sections.find((x) => x.yearId === year25.id && x.gradeId === prevGrade.id && x.name === secName)!
      const e: Enrollment = {
        id: id('enr'), code: `MAT-2025-${pad(next('m25'), 4)}`, studentId: s.id, yearId: year25.id, gradeId: prevGrade.id, sectionId: sec.id,
        status: 'finalizado', enrolledAt: '2025-03-01', matriculaAmount: year25.config.matriculaAmount, mensualidadAmount: year25.config.mensualidadAmount,
        installments: 10, discountPct: 0, conditions: '', events: [
          { at: '2025-03-01T09:00:00', status: 'matriculado', note: 'Matrícula registrada', userId: secretary.id },
          { at: '2025-12-19T12:00:00', status: 'finalizado', note: 'Año académico finalizado', userId: users[0].id },
        ],
      }
      enrollments.push(e)
      const obs = buildObligations(e, year25, () => id('ob'))
      obligations.push(...obs)
      // Se pagó todo en 2025
      for (const o of obs) { addPayment(e, [o], o.amount, o.dueDate < '2025-12-31' ? o.dueDate : '2025-12-05', pick<PaymentMethod>(['efectivo', 'yape', 'transferencia', 'plin']), users[3]) }
    }

    // Matrícula 2026
    const sec26Name = (sectionCount[grade.id] = (sectionCount[grade.id] ?? 0) + 1) % 2 === 0 ? 'B' : 'A'
    const sec26 = sections.find((x) => x.yearId === year26.id && x.gradeId === grade.id && x.name === sec26Name)!
    const pending = i % 13 === 7
    const status: Enrollment['status'] = withdrawn ? 'retirado' : pending ? 'pendiente' : 'matriculado'
    const disc = i % 11 === 3 ? 10 : 0
    const e: Enrollment = {
      id: id('enr'), code: `MAT-2026-${pad(next('m26'), 4)}`, studentId: s.id, yearId: year26.id, gradeId: grade.id, sectionId: sec26.id, status,
      enrolledAt: `2026-0${1 + (i % 3)}-${pad(5 + (i % 20))}`, matriculaAmount: year26.config.matriculaAmount, mensualidadAmount: year26.config.mensualidadAmount,
      installments: 10, discountPct: disc, conditions: disc ? 'Descuento por hermanos (10% en mensualidades).' : '', events: [],
    }
    e.events.push({ at: `${e.enrolledAt}T09:30:00`, status: pending ? 'pendiente' : 'matriculado', note: pending ? 'Matrícula iniciada, pendiente de pago de matrícula' : 'Matrícula registrada', userId: secretary.id })
    if (withdrawn) e.events.push({ at: '2026-08-14T11:00:00', status: 'retirado', note: 'Retiro solicitado por el apoderado (traslado).', userId: users[0].id })
    enrollments.push(e)
    logAudit(`${e.enrolledAt}T09:30:00`, secretary, 'crear', 'matriculas', `Registró la matrícula ${e.code} (${grade.name} ${sec26Name})`, e.code)
    if (withdrawn) logAudit('2026-08-14T11:00:00', users[0], 'retirar', 'matriculas', `Registró el retiro de la matrícula ${e.code}`, e.code)

    const allObs = buildObligations(e, year26, () => id('ob'))
    // Pendiente: solo la matrícula; las mensualidades se generan al confirmar la matrícula.
    const obs = pending ? allObs.filter((o) => o.concept === 'matricula') : allObs
    if (withdrawn) obs.filter((o) => o.dueDate > '2026-08-05').forEach((o) => { o.annulled = true })
    obligations.push(...obs)

    // Perfil de pago
    const profile = i % 8 // 0-4 al día | 5 parcial | 6 deuda moderada | 7 deuda alta
    const limit = obs.filter((o) => !o.annulled && o.dueDate <= SIM_TODAY)
    if (pending) {
      // Matrícula pendiente: sin pagos
    } else if (profile <= 4) {
      const upTo = profile % 3 === 0 ? obs.filter((o) => o.dueDate <= '2026-12-05') : limit
      for (const o of upTo.filter((x) => x.dueDate <= (profile % 3 === 0 ? '2026-12-05' : SIM_TODAY))) {
        if (o.annulled) continue
        const date = o.dueDate > SIM_TODAY ? SIM_TODAY : (o.concept === 'matricula' ? e.enrolledAt : o.dueDate)
        addPayment(e, [o], o.amount, date, pick<PaymentMethod>(['efectivo', 'yape', 'transferencia', 'plin']), users[3])
      }
    } else if (profile === 5) {
      limit.forEach((o, idx) => {
        const last = idx === limit.length - 1
        const amt = last ? Math.round(o.amount * 0.5 * 100) / 100 : o.amount
        addPayment(e, [o], amt, o.dueDate, pick<PaymentMethod>(['efectivo', 'yape', 'transferencia']), users[3])
      })
    } else if (profile === 6) {
      limit.slice(0, Math.max(1, limit.length - 3)).forEach((o) => addPayment(e, [o], o.amount, o.dueDate, pick<PaymentMethod>(['efectivo', 'plin', 'transferencia']), users[3]))
    } else {
      limit.slice(0, Math.max(1, limit.length - 6)).forEach((o) => addPayment(e, [o], o.amount, o.dueDate, 'efectivo', users[3]))
    }
  }

  // Un pago anulado de demostración (reversión simulada)
  const demo = payments.find((p) => p.status === 'confirmado' && p.date >= '2026-05-01')
  if (demo) {
    demo.status = 'anulado'; demo.voidReason = 'Error en el número de operación'; demo.voidedAt = '2026-06-02T15:10:00'; demo.voidedBy = users[3].id
    logAudit('2026-06-02T15:10:00', users[3], 'reversar', 'pagos', `Anuló el pago ${demo.code}: ${demo.voidReason}`, demo.code)
  }

  audit.sort((a, b) => a.at.localeCompare(b.at))

  return {
    version: DB_VERSION, academicYears, grades, sections, guardians, students, enrollments, obligations, payments, paymentDetails,
    audit, users, currentUserId: 'u-1', counters,
    institution: {
      name: 'Institución Educativa Particular ALFA', shortName: 'I.E.P. ALFA', ugel: 'UGEL 03 (demostración)',
      address: 'Av. Institucional 123, Lima, Perú', phone: '(01) 555-0100', email: 'contacto@iepalfa.edu.pe',
      director: 'Dra. Elena Paredes', currency: 'PEN',
    },
  }
}
