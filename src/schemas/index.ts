import { z } from 'zod'

const dni = z.string().regex(/^\d{8}$/, 'El DNI debe tener 8 dígitos')
const phone = z.string().regex(/^9\d{8}$/, 'Celular de 9 dígitos que inicia con 9')
const text = (min = 2, label = 'Campo') => z.string().trim().min(min, `${label} es obligatorio`)

export const guardianSchema = z.object({
  dni,
  names: text(2, 'Nombres'),
  surnames: text(2, 'Apellidos'),
  relationship: text(2, 'Parentesco'),
  phone,
  email: z.string().email('Correo no válido'),
  address: text(5, 'Dirección'),
})

export const studentSchema = z.object({
  dni,
  names: text(2, 'Nombres'),
  paternalSurname: text(2, 'Apellido paterno'),
  maternalSurname: text(2, 'Apellido materno'),
  birthDate: z.string().min(1, 'Fecha obligatoria').refine((v) => v < '2021-01-01' && v > '2005-01-01', 'Fecha fuera de rango escolar'),
  sex: z.enum(['M', 'F']),
  address: text(5, 'Dirección'),
  phone: z.string().regex(/^(9\d{8})?$/, 'Celular de 9 dígitos que inicia con 9'),
  email: z.union([z.literal(''), z.string().email('Correo no válido')]),
  photo: z.string().optional(),
  notes: z.string().max(300, 'Máximo 300 caracteres'),
  guardian: guardianSchema,
})
export type StudentFormValues = z.infer<typeof studentSchema>

export const economicSchema = z.object({
  matriculaAmount: z.number({ error: 'Importe inválido' }).min(0, 'No puede ser negativo'),
  mensualidadAmount: z.number({ error: 'Importe inválido' }).min(0, 'No puede ser negativo'),
  installments: z.number({ error: 'Cuotas inválidas' }).int().min(1, 'Mínimo 1').max(12, 'Máximo 12'),
  discountPct: z.number({ error: 'Descuento inválido' }).min(0).max(100),
  conditions: z.string().max(300),
})
export type EconomicFormValues = z.infer<typeof economicSchema>

export const paymentSchema = z.object({
  method: z.enum(['efectivo', 'transferencia', 'yape', 'plin', 'otros']),
  date: z.string().min(1, 'Fecha obligatoria'),
  operationNumber: z.string().max(30),
  notes: z.string().max(200),
}).superRefine((v, ctx) => {
  if (v.method !== 'efectivo' && v.operationNumber.trim().length < 4) {
    ctx.addIssue({ code: 'custom', path: ['operationNumber'], message: 'Ingrese el número de operación (mín. 4 caracteres)' })
  }
})
export type PaymentFormValues = z.infer<typeof paymentSchema>

export const userSchema = z.object({
  name: text(3, 'Nombre'),
  email: z.string().email('Correo no válido'),
  role: z.enum(['administrador', 'direccion', 'secretaria', 'tesoreria']),
})
export type UserFormValues = z.infer<typeof userSchema>
