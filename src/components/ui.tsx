import type { ButtonHTMLAttributes, ReactNode } from 'react';

const TONOS: Record<string, string> = {
  PAGADA: 'bg-success-50 text-success-600', MATRICULADO: 'bg-success-50 text-success-600', ACTIVO: 'bg-success-50 text-success-600', CONFIRMADO: 'bg-success-50 text-success-600',
  VENCIDA: 'bg-danger-50 text-danger-600', RETIRADO: 'bg-danger-50 text-danger-600',
  PARCIAL: 'bg-warning-50 text-warning-600',
  PENDIENTE: 'bg-info-50 text-info-600', FINALIZADO: 'bg-info-50 text-info-600',
};

export function Badge({ valor }: { valor: string }) {
  return <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${TONOS[valor] ?? 'bg-app text-muted'}`}>{valor}</span>;
}

export function Card({ titulo, derecha, children }: { titulo?: string; derecha?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-lg bg-surface p-5 shadow-sm">
      {(titulo || derecha) && (
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="font-semibold text-brand-900">{titulo}</h2>
          {derecha}
        </div>
      )}
      {children}
    </section>
  );
}

export function Stat({ etiqueta, valor, alerta }: { etiqueta: string; valor: string | number; alerta?: boolean }) {
  return (
    <div className="rounded-lg bg-surface p-4 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-muted">{etiqueta}</p>
      <p className={`mt-1 text-2xl font-semibold ${alerta ? 'text-accent-600' : 'text-brand-700'}`}>{valor}</p>
    </div>
  );
}

export const inputCls = 'w-full rounded-md border border-line bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500';
export const td = 'px-3 py-2';

export function Btn({ variante = 'primario', className = '', ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variante?: 'primario' | 'peligro' | 'suave' }) {
  const estilos = {
    primario: 'bg-brand-700 text-white hover:bg-brand-900',
    peligro: 'bg-danger-50 text-danger-600 hover:bg-danger-600 hover:text-white',
    suave: 'bg-app text-brand-900 hover:bg-line',
  }[variante];
  return <button type="button" className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${estilos} ${className}`} {...rest} />;
}

export function Tabla({ cabeceras, children }: { cabeceras: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line text-left text-xs uppercase text-muted">
            {cabeceras.map((c, i) => <th key={i} className="px-3 py-2 font-medium">{c}</th>)}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function Vacio({ texto }: { texto: string }) {
  return <p className="py-8 text-center text-sm text-muted">{texto}</p>;
}

export function Cargando() {
  return <p className="py-10 text-center text-sm text-muted">Cargando…</p>;
}
