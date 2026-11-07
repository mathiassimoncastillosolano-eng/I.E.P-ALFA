import { Link, useRouteError } from 'react-router-dom'
import { Compass, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function RouteError({ notFound }: { notFound?: boolean }) {
  const err = useRouteError() as Error | undefined
  const nf = notFound
  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-primary-soft text-primary">{nf ? <Compass className="size-7" /> : <TriangleAlert className="size-7" />}</div>
      <h1 className="text-2xl font-semibold text-ink">{nf ? 'Página no encontrada' : 'Algo salió mal'}</h1>
      <p className="max-w-md text-sm text-muted">{nf ? 'La ruta solicitada no existe en el sistema.' : err?.message ?? 'Ocurrió un error inesperado al mostrar esta pantalla.'}</p>
      <Link to="/dashboard"><Button>Volver al dashboard</Button></Link>
    </div>
  )
}
