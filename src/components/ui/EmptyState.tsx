import type { ReactNode } from 'react'
import { AlertTriangle, Inbox } from 'lucide-react'
import { Button } from './Button'

export function EmptyState({ title, description, icon, action }: { title: string; description?: string; icon?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="relative mb-4 flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-soft to-accent-soft text-primary ring-1 ring-inset ring-primary/10 [&>svg]:size-7">
        <span aria-hidden className="absolute -right-1 -top-1 size-3 rounded-full bg-[var(--brand-red)] ring-2 ring-surface" />
        {icon ?? <Inbox />}
      </div>
      <h4 className="text-[15px] font-semibold text-ink">{title}</h4>
      {description && <p className="mt-1 max-w-sm text-[13px] text-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center" role="alert">
      <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-danger-soft text-danger"><AlertTriangle className="size-6" /></div>
      <h4 className="text-[15px] font-semibold text-ink">No se pudo cargar la información</h4>
      <p className="mt-1 max-w-sm text-[13px] text-muted">{message}</p>
      {onRetry && <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>Reintentar</Button>}
    </div>
  )
}
