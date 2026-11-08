import { motion } from 'motion/react'
import { ArrowRight, ShieldCheck } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Escudo } from '@/components/shared/Escudo'
import { Avatar } from '@/components/ui/Avatar'
import { useAsync } from '@/hooks/useAsync'
import { userService } from '@/services/userService'
import { ROLE_LABEL } from '@/constants'
import { useUi } from '@/stores/uiStore'
import { notify } from '@/utils/toast'
import { Skeleton } from '@/components/ui/Skeleton'

const BLURB = { administrador: 'Control total del sistema', direccion: 'Supervisión, reportes y auditoría', secretaria: 'Estudiantes y matrículas', tesoreria: 'Pagos, cobranzas y finanzas' } as const

export default function LoginPage() {
  const users = useAsync(() => userService.list(), [])
  const setEntered = useUi((s) => s.setEntered)
  const navigate = useNavigate()
  const loc = useLocation()
  const enter = async (id: string, name: string) => {
    try {
      await userService.switchTo(id)
      setEntered(true)
      notify.success(`Bienvenido/a, ${name}`)
      navigate((loc.state as { from?: string } | null)?.from ?? '/dashboard', { replace: true })
    } catch (e) { notify.error(e) }
  }
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      <section className="hero-surface relative hidden flex-col justify-between overflow-hidden p-12 text-white lg:flex">
        <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 size-[28rem] rounded-full border border-white/10" />
        <div className="relative flex items-center gap-3"><Escudo glow size={60} /><div className="leading-tight"><p className="text-lg font-semibold tracking-tight">I.E.P. ALFA</p><p className="text-xs text-white/60">Institución Educativa Particular · Perú</p></div></div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="relative max-w-lg">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-white/60">Sistema de gestión escolar</p>
          <h1 className="text-[44px] font-semibold leading-[1.05] tracking-tight">Toda la gestión académica y económica, en un solo lugar.</h1>
          <p className="mt-5 text-base text-white/70">Matrículas, mensualidades, pagos y reportes conectados en tiempo real para el equipo administrativo.</p>
        </motion.div>
        <p className="relative text-xs text-white/50">Versión de demostración · Todos los datos son ficticios.</p>
      </section>
      <section className="flex items-center justify-center bg-bg p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden"><div className="rounded-xl bg-primary p-1.5"><Escudo size={36} /></div><p className="text-lg font-semibold">I.E.P. ALFA</p></div>
          <h2 className="text-[26px] font-semibold tracking-tight text-ink">Ingreso de demostración</h2>
          <p className="mt-1.5 text-sm text-muted">Seleccione un perfil para explorar el sistema. No se requiere contraseña.</p>
          <ul className="mt-8 space-y-3">
            {users.loading ? [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[74px] rounded-[14px]" />) : users.data?.filter((u) => u.active).map((u, i) => (
              <motion.li key={u.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.07 }}>
                <button onClick={() => enter(u.id, u.name)} className="group flex w-full items-center gap-4 rounded-[14px] border border-line bg-surface p-4 text-left shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-card">
                  <Avatar name={u.name} size="lg" />
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-ink">{u.name}</p><p className="text-xs font-medium text-primary">{ROLE_LABEL[u.role]}</p><p className="truncate text-xs text-muted">{BLURB[u.role]}</p></div>
                  <ArrowRight className="size-4 text-muted transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                </button>
              </motion.li>
            ))}
          </ul>
          <p className="mt-8 flex items-center gap-2 text-xs text-muted"><ShieldCheck className="size-4 text-success" />Sesión simulada · sin autenticación real ni servidores.</p>
        </div>
      </section>
    </div>
  )
}
