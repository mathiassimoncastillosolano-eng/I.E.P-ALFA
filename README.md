# I.E.P. ALFA — Sistema de Gestión Escolar

Frontend con datos mock (React + Vite + TypeScript + Tailwind). Sin backend: todo pasa por `src/services`, que simula una API sobre `src/mocks/db.ts` (localStorage, clave `iepalfa:v1`).

## Uso
1. `npm install`
2. `npm run dev` · `npm run build` · `npm test`
3. Botón "Restablecer demo" (arriba a la derecha) vuelve al seed.

## Módulos incluidos
Dashboard · Estudiantes (registro, búsqueda, filtro, paginación) · Matrículas (genera matrícula + 10 mensualidades, retiro/anulación) ·
Pagos y estado de cuenta (parcial/total, reversión) · Deudas · Auditoría.

## Pendientes (siguientes etapas con Claude Code)
Reportes, usuarios/roles, configuración económica/académica por año, perfil de estudiante, exportación PDF/Excel, edición de estudiantes,
formularios con Zod/React Hook Form, componentes con Radix, animaciones y refinamiento responsive. Ver `docs/ARQUITECTURA.md`.
