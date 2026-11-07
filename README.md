# I.E.P. ALFA · Sistema de Gestión Escolar (frontend con datos Mock)

React + Vite + TypeScript + Tailwind v4 · Zustand · React Hook Form + Zod · TanStack Table v8 · Recharts · Motion · Radix · Sonner.
Sin backend: `src/services/*` simulan una API REST (promesas con latencia) sobre `localStorage`. Reemplazar cada servicio por HTTP no exige tocar la UI.

## Ejecutar
npm install && npm run dev      (build: npm run build)

## Escudo institucional (PENDIENTE)
Copie el archivo original a `public/logos/escudo-alfa.png`. Hasta entonces se muestra un recuadro "IEP" provisional (no es una recreación del escudo).

## Notas
- Fecha simulada del sistema: 07-nov-2026 (`src/constants`), contra la que se derivan vencidas/programadas.
- Restablecer datos: menú de perfil o Administración → Configuración.
- Cambiar de usuario (rol) desde el menú de perfil para ver permisos.
