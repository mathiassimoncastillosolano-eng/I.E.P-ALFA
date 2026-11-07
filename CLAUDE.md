# I.E.P. ALFA — Sistema de Gestión Escolar (frontend con datos mock)

## Fuentes de verdad
- Requisitos: docs/MASTER_PROMPT.md (pegar aquí el Master Prompt completo)
- Arquitectura, tokens, tipos y reglas: docs/ARQUITECTURA.md
- Escudo: src/assets/logos/escudo-alfa.png (NO recrear ni sustituir)

## Estado del proyecto base
Ya existen: package.json (dependencias declaradas), Vite + TS + Tailwind configurados,
tokens (src/styles/tokens.css), tipos (src/types), funciones financieras derivadas con
pruebas (src/utils/finanzas*.ts) y una pantalla provisional. Todo lo demás está por construir.
Antes de nada: `npm install`, `npm run build`, `npm test`. Falta añadir Radix/shadcn.

## Reglas duras
- Solo frontend. Sin backend, sin HTTP externo, sin auth real.
- Los componentes NUNCA tocan los arreglos mock. Todo pasa por src/services/*.
- Dinero en céntimos (enteros). Fechas ISO (YYYY-MM-DD). Un "reloj simulado" en store.
- Estados económicos DERIVADOS (utils/finanzas), nunca guardados a mano.
- Sin hex sueltos en componentes: solo tokens/variables.
- Sin `any` indiscriminado, sin botones muertos, sin datos duplicados.
- No se borra historial: retiro/anulación/reversión, nunca delete físico.
- Código y textos de UI en español.

## Forma de trabajar
- Una etapa a la vez, en el orden del Master Prompt (sección 23).
- Al terminar cada módulo: `npm run build`, `npm run lint` y `npm test` sin errores; commit claro.
- Antes de pasar al siguiente módulo, verificar los criterios de aceptación (sección 22).
- Si una decisión del prompt es deficiente, proponer la corrección y explicarla antes de aplicarla.
