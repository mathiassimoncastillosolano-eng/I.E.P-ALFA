import { format, parseISO, differenceInCalendarDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { SIM_TODAY } from '@/constants'

export const money = (n: number) =>
  new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', minimumFractionDigits: 2 }).format(n)
export const moneyCompact = (n: number) =>
  n >= 1000 ? `S/ ${(n / 1000).toLocaleString('es-PE', { maximumFractionDigits: 1 })}k` : `S/ ${Math.round(n)}`
export const fmtDate = (iso: string) => format(parseISO(iso), 'dd MMM yyyy', { locale: es })
export const fmtDateShort = (iso: string) => format(parseISO(iso), 'dd/MM/yyyy')
export const fmtDateTime = (iso: string) => format(parseISO(iso), "dd MMM yyyy · HH:mm", { locale: es })
export const fmtMonth = (ym: string) => format(parseISO(`${ym}-01`), 'MMM yyyy', { locale: es })
export const todayIso = () => SIM_TODAY
export const daysBetween = (fromIso: string, toIso: string) => differenceInCalendarDays(parseISO(toIso), parseISO(fromIso))
export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100
export const cn = (...v: (string | false | null | undefined)[]) => v.filter(Boolean).join(' ')
export const initials = (name: string) => name.split(' ').filter(Boolean).slice(0, 2).map((s) => s[0]).join('').toUpperCase()
export const fullName = (s: { names: string; paternalSurname: string; maternalSurname: string }) =>
  `${s.names} ${s.paternalSurname} ${s.maternalSurname}`
