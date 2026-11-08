import { AnimatePresence, motion } from 'motion/react'
import { ChevronDown, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Escudo } from '@/components/shared/Escudo'
import { Tooltip } from '@/components/ui/Tooltip'
import { cx } from '@/utils/cn'
import { useUi } from '@/stores/uiStore'
import { useCan } from '@/hooks/usePermission'
import { NAV } from '../router/routes'

export function SidebarContent({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const { pathname } = useLocation()
  const can = useCan()
  const [closed, setClosed] = useState<Record<string, boolean>>({})
  return (
    <nav aria-label="Navegación principal" className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden px-3 pb-4 pt-2">
      {NAV.map((g) => {
        const items = g.items.filter((i) => !i.perm || can(i.perm) || true)
        const isClosed = !collapsed && closed[g.id]
        return (
          <div key={g.id} className="pt-3 first:pt-0">
            {collapsed ? <div className="mx-3 mb-2 h-px bg-white/10" /> : (
              <button onClick={() => setClosed((c) => ({ ...c, [g.id]: !c[g.id] }))} aria-expanded={!isClosed}
                className="flex w-full items-center justify-between px-3 pb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[var(--sidebar-muted)] transition-colors hover:text-white">
                {g.label}<ChevronDown className={cx('size-3.5 transition-transform', isClosed && '-rotate-90')} />
              </button>
            )}
            <AnimatePresence initial={false}>
              {!isClosed && (
                <motion.ul initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} className="space-y-0.5 overflow-hidden">
                  {items.map((it) => {
                    const active = pathname === it.to || pathname.startsWith(it.to + '/')
                    const Icon = it.icon
                    const link = (
                      <NavLink to={it.to} onClick={onNavigate} aria-current={active ? 'page' : undefined}
                        className={cx('group relative flex h-10 items-center gap-3 rounded-[10px] px-3 text-[13.5px] font-medium transition-colors', active ? 'text-white' : 'text-[var(--sidebar-fg)] hover:bg-white/5 hover:text-white', collapsed && 'justify-center px-0')}>
                        {active && <motion.span layoutId="nav-active" className="absolute inset-0 rounded-[10px] bg-gradient-to-r from-white/[0.14] to-white/[0.05] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] ring-1 ring-white/10" transition={{ type: 'spring', stiffness: 500, damping: 38 }} />}
                        {active && <motion.span layoutId="nav-bar" className="absolute -left-3 top-2 h-6 w-1 rounded-r-full bg-[var(--brand-red)] shadow-[0_0_10px_rgba(217,39,53,0.7)]" />}
                        <Icon className={cx('relative size-[18px] shrink-0 transition-transform group-hover:scale-110', active && 'text-white')} />
                        {!collapsed && <span className="relative truncate">{it.label}</span>}
                      </NavLink>
                    )
                    return <li key={it.to}>{collapsed ? <Tooltip label={it.label} side="right">{link}</Tooltip> : link}</li>
                  })}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </nav>
  )
}

export function Sidebar() {
  const { sidebarCollapsed: collapsed, toggleSidebar } = useUi()
  return (
    <motion.aside animate={{ width: collapsed ? 76 : 268 }} transition={{ type: 'spring', stiffness: 380, damping: 38 }}
      className="relative z-30 hidden h-dvh shrink-0 flex-col bg-sidebar text-white lg:flex">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(400px_220px_at_0%_0%,rgba(22,138,196,0.22),transparent_70%)]" />
      <div className={cx('relative flex h-[72px] shrink-0 items-center gap-3 border-b border-white/5 px-4', collapsed && 'justify-center px-0')}>
        <Escudo glow size={collapsed ? 40 : 46} />
        {!collapsed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-w-0 leading-tight">
            <p className="truncate text-[15px] font-bold leading-tight tracking-tight">I.E.P. ALFA</p>
            <p className="truncate text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--sidebar-muted)]">Gestión escolar</p>
          </motion.div>
        )}
      </div>
      <div className="relative flex min-h-0 flex-1 flex-col"><SidebarContent collapsed={collapsed} /></div>
      <div className="relative border-t border-white/10 p-3">
        <Tooltip label={collapsed ? 'Expandir menú' : 'Contraer menú'} side="right">
          <button onClick={toggleSidebar} aria-label={collapsed ? 'Expandir menú' : 'Contraer menú'}
            className={cx('flex h-9 w-full items-center gap-3 rounded-[10px] px-3 text-[13px] text-[var(--sidebar-fg)] transition-colors hover:bg-white/5 hover:text-white', collapsed && 'justify-center px-0')}>
            {collapsed ? <PanelLeftOpen className="size-[18px]" /> : <><PanelLeftClose className="size-[18px]" />Contraer menú</>}
          </button>
        </Tooltip>
      </div>
    </motion.aside>
  )
}
