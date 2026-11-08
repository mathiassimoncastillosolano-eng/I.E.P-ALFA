import * as Dialog from '@radix-ui/react-dialog'
import { AnimatePresence, motion } from 'motion/react'
import { Suspense, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Escudo } from '@/components/shared/Escudo'
import { Skeleton, CardSkeleton } from '@/components/ui/Skeleton'
import { Sidebar, SidebarContent } from './Sidebar'
import { Header } from './Header'

function PageFallback() {
  return (
    <div className="space-y-6" role="status" aria-label="Cargando módulo">
      <div className="space-y-2"><Skeleton className="h-7 w-56" /><Skeleton className="h-4 w-96 max-w-full" /></div>
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">{[0, 1, 2, 3].map((i) => <CardSkeleton key={i} />)}</div>
      <Skeleton className="h-72 w-full rounded-[14px]" />
    </div>
  )
}

export function AppLayout() {
  const [mobile, setMobile] = useState(false)
  const { pathname } = useLocation()
  return (
    <div className="flex h-dvh overflow-hidden bg-bg">
      <a href="#contenido" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-fg">Saltar al contenido</a>
      <Sidebar />
      <Dialog.Root open={mobile} onOpenChange={setMobile}>
        <AnimatePresence>
          {mobile && (
            <Dialog.Portal forceMount>
              <Dialog.Overlay asChild forceMount><motion.div className="fixed inset-0 z-50 bg-[#0a1130]/55 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} /></Dialog.Overlay>
              <Dialog.Content asChild forceMount>
                <motion.aside initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', stiffness: 380, damping: 40 }} className="fixed inset-y-0 left-0 z-50 flex w-[280px] max-w-[85vw] flex-col bg-sidebar text-white shadow-pop">
                  <Dialog.Title className="sr-only">Menú de navegación</Dialog.Title>
                  <Dialog.Description className="sr-only">Navegación principal del sistema</Dialog.Description>
                  <div className="flex h-16 items-center gap-3 px-4"><Escudo glow size={44} /><div className="leading-tight"><p className="text-[15px] font-semibold">I.E.P. ALFA</p><p className="text-[11px] text-[var(--sidebar-muted)]">Gestión escolar</p></div></div>
                  <SidebarContent collapsed={false} onNavigate={() => setMobile(false)} />
                </motion.aside>
              </Dialog.Content>
            </Dialog.Portal>
          )}
        </AnimatePresence>
      </Dialog.Root>

      <div className="flex min-w-0 flex-1 flex-col">
        <Header onMenu={() => setMobile(true)} />
        <main id="contenido" className="min-h-0 flex-1 overflow-y-auto">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={pathname} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }} className="mx-auto w-full max-w-[1480px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
              <Suspense fallback={<PageFallback />}><Outlet /></Suspense>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
