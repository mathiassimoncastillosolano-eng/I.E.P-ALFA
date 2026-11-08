import { Bell, CalendarRange, ChevronDown, Command, DatabaseBackup, Menu, Moon, Search, Sun, UserRoundCog } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Avatar } from '@/components/ui/Avatar'
import { IconButton } from '@/components/ui/Button'
import { Dropdown } from '@/components/ui/Dropdown'
import { Select } from '@/components/ui/Select'
import { Breadcrumbs } from '@/components/shared/Breadcrumbs'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/Confirm'
import { useUi } from '@/stores/uiStore'
import { useAsync } from '@/hooks/useAsync'
import { useCurrentUser } from '@/hooks/usePermission'
import { academicService } from '@/services/academicService'
import { dashboardService } from '@/services/dashboardService'
import { userService, settingsService } from '@/services/userService'
import { ROLE_LABEL } from '@/constants'
import { notify } from '@/utils/toast'
import { cx } from '@/utils/cn'
import { GlobalSearch } from './GlobalSearch'
import * as Popover from '@radix-ui/react-dropdown-menu'

export function Header({ onMenu }: { onMenu: () => void }) {
  const { theme, toggleTheme, yearId, setYear } = useUi()
  const user = useCurrentUser()
  const navigate = useNavigate()
  const years = useAsync(() => academicService.years(), [])
  const alerts = useAsync(() => dashboardService.get(yearId), [yearId])
  const users = useAsync(() => userService.list(), [])
  const [searchOpen, setSearchOpen] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const [switchOpen, setSwitchOpen] = useState(false)

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setSearchOpen(true) } }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  const nAlerts = alerts.data?.alerts.length ?? 0
  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 border-b border-line bg-surface/85 px-4 backdrop-blur-md lg:px-8">
      <IconButton label="Abrir menú" className="lg:hidden" onClick={onMenu}><Menu /></IconButton>
      <div className="hidden min-w-0 flex-1 md:block"><Breadcrumbs /></div>
      <div className="flex-1 md:hidden" />

      <button onClick={() => setSearchOpen(true)} className="hidden h-9 w-64 items-center gap-2 rounded-[10px] border border-line-strong bg-surface-2 px-3 text-[13px] text-muted transition-colors hover:border-primary/40 hover:text-ink lg:flex xl:w-80">
        <Search className="size-4" /><span className="flex-1 text-left">Buscar estudiantes, matrículas…</span>
        <kbd className="flex items-center gap-0.5 rounded border border-line-strong bg-surface px-1.5 py-0.5 text-[10px] font-semibold"><Command className="size-2.5" />K</kbd>
      </button>
      <IconButton label="Buscar" className="lg:hidden" onClick={() => setSearchOpen(true)}><Search /></IconButton>

      <Select aria-label="Año académico" className="hidden w-44 sm:block" triggerClassName="h-9 text-[13px] font-medium" leading={<CalendarRange className="text-primary" />} value={yearId}
        onChange={(e) => { setYear(e.target.value); notify.info(`Año académico ${years.data?.find((y) => y.id === e.target.value)?.year}`) }}
        options={years.data?.map((y) => ({ value: y.id, label: `${y.year}${y.status === 'activo' ? ' · activo' : y.status === 'planificado' ? ' · plan.' : ''}` })) ?? []} />

      <IconButton label={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'} onClick={toggleTheme}>{theme === 'dark' ? <Sun /> : <Moon />}</IconButton>

      <Popover.Root>
        <Popover.Trigger asChild>
          <button aria-label={`Notificaciones (${nAlerts})`} className="relative flex size-9 items-center justify-center rounded-[10px] text-ink-2 transition-colors hover:bg-surface-3 hover:text-ink">
            <Bell className="size-4" />{nAlerts > 0 && <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-danger ring-2 ring-surface" />}
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content align="end" sideOffset={8} className="z-[60] w-[340px] overflow-hidden rounded-xl border border-line bg-surface shadow-pop data-[state=open]:animate-pop">
            <div className="flex items-center justify-between border-b border-line px-4 py-3"><p className="text-sm font-semibold">Notificaciones</p><Badge tone="primary" dot={false}>{nAlerts}</Badge></div>
            <div className="max-h-80 overflow-y-auto p-1.5">
              {alerts.data?.alerts.map((a) => (
                <Popover.Item key={a.id} onSelect={() => navigate(a.href)} className="flex cursor-pointer gap-3 rounded-lg p-2.5 outline-none data-[highlighted]:bg-surface-3">
                  <span className={cx('mt-1.5 size-2 shrink-0 rounded-full', a.level === 'danger' ? 'bg-danger' : a.level === 'warning' ? 'bg-warning' : 'bg-accent')} />
                  <div><p className="text-[13px] font-medium text-ink">{a.title}</p><p className="text-xs text-muted">{a.detail}</p></div>
                </Popover.Item>
              ))}
              {!nAlerts && <p className="px-3 py-6 text-center text-sm text-muted">Sin alertas pendientes</p>}
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>

      <Dropdown
        header={<div className="flex items-center gap-2.5"><Avatar name={user.name} size="sm" /><div className="min-w-0"><p className="truncate text-[13px] font-semibold">{user.name}</p><p className="truncate text-xs text-muted">{user.email}</p></div></div>}
        items={[
          { label: 'Cambiar usuario (simulado)', icon: <UserRoundCog />, onSelect: () => setSwitchOpen(true) },
          { label: 'Administrar usuarios', icon: <UserRoundCog />, onSelect: () => navigate('/administracion/usuarios') },
          { label: 'Restablecer datos de demostración', icon: <DatabaseBackup />, onSelect: () => setResetOpen(true), separatorBefore: true, danger: true },
        ]}
        trigger={
          <button aria-label="Menú de usuario" className="flex items-center gap-2.5 rounded-[12px] py-1 pl-1 pr-2 transition-colors hover:bg-surface-3">
            <Avatar name={user.name} size="md" />
            <span className="hidden text-left leading-tight md:block"><span className="block text-[13px] font-semibold text-ink">{user.name}</span><span className="block text-xs text-muted">{ROLE_LABEL[user.role]}</span></span>
            <ChevronDown className="hidden size-3.5 text-muted md:block" />
          </button>
        } />

      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
      <Modal open={switchOpen} onOpenChange={setSwitchOpen} title="Cambiar usuario simulado" description="No existe autenticación real: solo se simula el rol para demostrar los permisos." size="sm">
        <ul className="space-y-2">
          {users.data?.filter((u) => u.active).map((u) => (
            <li key={u.id}>
              <button onClick={async () => { try { await userService.switchTo(u.id); notify.success(`Sesión simulada como ${u.name}`, ROLE_LABEL[u.role]); setSwitchOpen(false) } catch (e) { notify.error(e) } }}
                className={cx('flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors hover:border-primary/50 hover:bg-primary-soft/50', u.id === user.id ? 'border-primary bg-primary-soft/60' : 'border-line')}>
                <Avatar name={u.name} /><div className="min-w-0 flex-1"><p className="text-sm font-medium">{u.name}</p><p className="text-xs text-muted">{ROLE_LABEL[u.role]}</p></div>
                {u.id === user.id && <Badge tone="primary">Actual</Badge>}
              </button>
            </li>
          ))}
        </ul>
      </Modal>
      <ConfirmDialog open={resetOpen} onOpenChange={setResetOpen} tone="danger" title="Restablecer datos de demostración"
        description="Se descartarán todos los cambios realizados y se restaurarán los datos iniciales (estudiantes, matrículas, pagos y auditoría)." confirmLabel="Restablecer"
        onConfirm={async () => { await settingsService.reset(); notify.success('Datos de demostración restablecidos') }} />
    </header>
  )
}
