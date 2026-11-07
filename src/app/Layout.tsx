import { NavLink, Outlet } from 'react-router-dom';
import { AlertTriangle, GraduationCap, LayoutDashboard, RotateCcw, ShieldCheck, Users, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import escudo from '@/assets/logos/escudo-alfa.png';
import { api, mensaje } from '@/services';
import { useApp } from '@/stores/app';
import { HOY } from '@/mocks/db';
import { fechaCorta } from '@/utils/formato';

const ENLACES = [
  { to: '/', etiqueta: 'Dashboard', Icono: LayoutDashboard },
  { to: '/estudiantes', etiqueta: 'Estudiantes', Icono: Users },
  { to: '/matriculas', etiqueta: 'Matrículas', Icono: GraduationCap },
  { to: '/pagos', etiqueta: 'Pagos y estado de cuenta', Icono: Wallet },
  { to: '/deudas', etiqueta: 'Deudas', Icono: AlertTriangle },
  { to: '/auditoria', etiqueta: 'Auditoría', Icono: ShieldCheck },
];

export default function Layout() {
  const bump = useApp((s) => s.bump);
  const restablecer = () => {
    if (!window.confirm('¿Restablecer los datos de demostración? Se perderán los cambios hechos.')) return;
    api.restablecer().then(() => { bump(); toast.success('Datos de demostración restablecidos'); }).catch((e: unknown) => toast.error(mensaje(e)));
  };
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-[var(--sidebar-w)] shrink-0 flex-col bg-brand-900 p-4 text-white md:flex">
        <div className="mb-6 flex items-center gap-3">
          <img src={escudo} alt="Escudo I.E.P. ALFA" className="h-12 w-12 rounded-md bg-white object-contain p-0.5" />
          <div>
            <p className="font-semibold leading-tight">I.E.P. ALFA</p>
            <p className="text-xs text-white/60">Gestión escolar</p>
          </div>
        </div>
        <nav className="flex flex-col gap-1">
          {ENLACES.map(({ to, etiqueta, Icono }) => (
            <NavLink key={to} to={to} end={to === '/'}
              className={({ isActive }) => `flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${isActive ? 'bg-brand-700 font-medium' : 'text-white/75 hover:bg-white/10'}`}>
              <Icono size={18} /> {etiqueta}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="min-w-0 flex-1">
        <nav className="flex gap-1 overflow-x-auto bg-brand-900 p-2 md:hidden">
          {ENLACES.map(({ to, etiqueta }) => (
            <NavLink key={to} to={to} end={to === '/'}
              className={({ isActive }) => `whitespace-nowrap rounded-md px-3 py-1.5 text-sm ${isActive ? 'bg-brand-700 text-white' : 'text-white/75'}`}>
              {etiqueta}
            </NavLink>
          ))}
        </nav>
        <header className="flex h-[var(--header-h)] items-center justify-between border-b border-line bg-surface px-5">
          <p className="text-sm text-muted">Fecha de trabajo: <strong className="text-brand-900">{fechaCorta(HOY)}</strong> · Usuario: Administrador (demo)</p>
          <button type="button" onClick={restablecer} className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-brand-700 hover:bg-app">
            <RotateCcw size={16} /> Restablecer demo
          </button>
        </header>
        <main className="space-y-5 p-5"><Outlet /></main>
      </div>
    </div>
  );
}
