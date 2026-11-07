import escudo from '@/assets/logos/escudo-alfa.png';

/** Pantalla provisional. Se reemplaza en la ETAPA 3 (layout + rutas). */
export default function App() {
  return (
    <main className="min-h-screen grid place-items-center p-6">
      <section className="bg-surface rounded-lg shadow-md p-10 text-center max-w-md">
        <img src={escudo} alt="Escudo I.E.P. ALFA" className="w-32 h-32 mx-auto object-contain" />
        <h1 className="mt-6 text-2xl font-semibold text-brand-700">I.E.P. ALFA</h1>
        <p className="mt-1 text-muted">Sistema de Gestión Escolar</p>
        <p className="mt-6 text-sm text-muted">
          Proyecto base listo. Abre Claude Code y sigue las instrucciones de <code>CLAUDE.md</code>.
        </p>
      </section>
    </main>
  );
}
