import { BarChart3, BookOpen, CalendarRange, ClipboardList, CreditCard, FileClock, FileText, GraduationCap, Landmark, LayoutDashboard, Layers, Receipt, ScrollText, Settings, ShieldCheck, Users, UserCog, WalletCards, AlertCircle } from 'lucide-react'
import type { ComponentType } from 'react'
import type { Permission } from '@/types'

export interface NavItem { to: string; label: string; icon: ComponentType<{ className?: string }>; perm?: Permission }
export interface NavGroup { id: string; label: string; items: NavItem[] }

export const NAV: NavGroup[] = [
  { id: 'general', label: 'General', items: [{ to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }] },
  { id: 'academica', label: 'Gestión académica', items: [
    { to: '/academico/estudiantes', label: 'Estudiantes', icon: GraduationCap },
    { to: '/academico/matriculas', label: 'Matrículas', icon: ClipboardList },
    { to: '/academico/estructura', label: 'Grados y secciones', icon: Layers },
    { to: '/academico/anios', label: 'Años académicos', icon: CalendarRange },
  ] },
  { id: 'economica', label: 'Gestión económica', items: [
    { to: '/economico/mensualidades', label: 'Mensualidades', icon: WalletCards },
    { to: '/economico/pagos', label: 'Pagos', icon: CreditCard },
    { to: '/economico/estados-cuenta', label: 'Estado de cuenta', icon: Receipt },
    { to: '/economico/deudas', label: 'Deudas y pendientes', icon: AlertCircle },
  ] },
  { id: 'reportes', label: 'Reportes', items: [
    { to: '/reportes/academicos', label: 'Reportes académicos', icon: BookOpen },
    { to: '/reportes/economicos', label: 'Reportes económicos', icon: BarChart3 },
    { to: '/reportes/operaciones', label: 'Historial de operaciones', icon: FileClock },
  ] },
  { id: 'admin', label: 'Administración', items: [
    { to: '/administracion/usuarios', label: 'Usuarios y roles', icon: Users },
    { to: '/administracion/auditoria', label: 'Auditoría', icon: ShieldCheck, perm: 'audit.read' },
    { to: '/administracion/configuracion', label: 'Configuración institucional', icon: Settings },
  ] },
]

export const ROUTE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/academico': 'Académico', '/academico/estudiantes': 'Estudiantes', '/academico/matriculas': 'Matrículas', '/academico/matriculas/nueva': 'Nueva matrícula',
  '/academico/estructura': 'Grados y secciones', '/academico/anios': 'Años académicos',
  '/economico': 'Económico', '/economico/mensualidades': 'Mensualidades', '/economico/pagos': 'Pagos', '/economico/estados-cuenta': 'Estado de cuenta', '/economico/deudas': 'Deudas y pendientes',
  '/reportes': 'Reportes', '/reportes/academicos': 'Reportes académicos', '/reportes/economicos': 'Reportes económicos', '/reportes/operaciones': 'Historial de operaciones',
  '/administracion': 'Administración', '/administracion/usuarios': 'Usuarios y roles', '/administracion/auditoria': 'Auditoría', '/administracion/configuracion': 'Configuración institucional',
}
export const ICON_FALLBACK = { FileText, Landmark, ScrollText, UserCog }
