import { ChevronRight } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { ROUTE_TITLES } from '@/app/router/routes'

export function Breadcrumbs() {
  const { pathname } = useLocation()
  const parts = pathname.split('/').filter(Boolean)
  const crumbs = parts.map((_, i) => {
    const path = '/' + parts.slice(0, i + 1).join('/')
    return { path, label: ROUTE_TITLES[path] ?? (/^[a-z]{2,4}-\d+/.test(parts[i]) ? 'Detalle' : parts[i]) }
  })
  return (
    <nav aria-label="Ruta de navegación" className="flex min-w-0 items-center gap-1 text-[13px] text-muted">
      <Link to="/dashboard" className="hover:text-ink">Inicio</Link>
      {crumbs.filter((c) => ROUTE_TITLES[c.path] !== undefined || /^[a-z]{2,4}-\d+/.test(c.label) || c.label === 'Detalle').map((c, i, arr) => (
        <span key={c.path} className="flex min-w-0 items-center gap-1">
          <ChevronRight className="size-3.5 shrink-0" />
          {i === arr.length - 1 ? <span className="truncate font-medium text-ink">{c.label}</span> : <Link to={c.path} className="truncate hover:text-ink">{c.label}</Link>}
        </span>
      ))}
    </nav>
  )
}
