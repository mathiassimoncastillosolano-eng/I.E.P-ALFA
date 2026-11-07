import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useUi } from '@/stores/uiStore'

/** Sesión simulada: solo recuerda que se pasó por la pantalla de ingreso de demostración. */
export function RequireSession({ children }: { children: ReactNode }) {
  const entered = useUi((s) => s.entered)
  const loc = useLocation()
  if (!entered) return <Navigate to="/login" replace state={{ from: loc.pathname + loc.search }} />
  return <>{children}</>
}
