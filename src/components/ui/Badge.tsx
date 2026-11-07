import type { ReactNode } from 'react'
import { cx } from '@/utils/cn'
import { ENROLLMENT_STATUS_LABEL, OBLIGATION_STATUS_LABEL, STUDENT_STATUS_LABEL } from '@/constants'
import type { EnrollmentStatus, ObligationStatus, StudentStatus } from '@/types'

type Tone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'accent'
const tones: Record<Tone, string> = {
  neutral: 'bg-surface-3 text-ink-2', primary: 'bg-primary-soft text-primary', success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning', danger: 'bg-danger-soft text-danger', accent: 'bg-accent-soft text-accent',
}
const dots: Record<Tone, string> = { neutral: 'bg-muted', primary: 'bg-primary', success: 'bg-success', warning: 'bg-warning', danger: 'bg-danger', accent: 'bg-accent' }

export function Badge({ tone = 'neutral', dot = true, children, className }: { tone?: Tone; dot?: boolean; children: ReactNode; className?: string }) {
  return (
    <span className={cx('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium', tones[tone], className)}>
      {dot && <span className={cx('size-1.5 rounded-full', dots[tone])} />}{children}
    </span>
  )
}

const enrTone: Record<EnrollmentStatus, Tone> = { pendiente: 'warning', matriculado: 'success', retirado: 'neutral', anulado: 'danger', finalizado: 'primary' }
export const EnrollmentBadge = ({ status }: { status: EnrollmentStatus }) => <Badge tone={enrTone[status]}>{ENROLLMENT_STATUS_LABEL[status]}</Badge>
const stuTone: Record<StudentStatus, Tone> = { activo: 'success', inactivo: 'neutral', retirado: 'danger' }
export const StudentBadge = ({ status }: { status: StudentStatus }) => <Badge tone={stuTone[status]}>{STUDENT_STATUS_LABEL[status]}</Badge>
const obTone: Record<ObligationStatus, Tone> = { programada: 'neutral', pendiente: 'accent', parcial: 'warning', vencida: 'danger', pagada: 'success', anulada: 'neutral' }
export const ObligationBadge = ({ status }: { status: ObligationStatus }) => <Badge tone={obTone[status]}>{OBLIGATION_STATUS_LABEL[status]}</Badge>
