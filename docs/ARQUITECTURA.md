# I.E.P. ALFA — Kit de arranque para Claude Code

Contenido: (1) cómo usarlo, (2) prompt de arranque / `CLAUDE.md`, (3) design tokens, (4) modelo de datos, (5) reglas de negocio, (6) patrón de servicios mock, (7) plan del seed, (8) validación extremo a extremo.

---

## 1. Cómo usarlo

1. Crea el proyecto: `npm create vite@latest iep-alfa -- --template react-ts` y entra a la carpeta.
2. Copia `escudo-alfa.png` a `src/assets/logos/escudo-alfa.png`.
3. Guarda tu Master Prompt completo como `docs/MASTER_PROMPT.md`.
4. Copia la sección 2 de este archivo como `CLAUDE.md` en la raíz.
5. Copia las secciones 3 a 8 a `docs/ARQUITECTURA.md` (Claude Code las leerá como referencia).
6. Abre Claude Code en la carpeta y pega el prompt corto de la sección 2.2.

---

## 2. Prompt de arranque

### 2.1 `CLAUDE.md` (raíz del proyecto)

```md
# I.E.P. ALFA — Sistema de Gestión Escolar (frontend con datos mock)

## Fuentes de verdad
- Requisitos: docs/MASTER_PROMPT.md
- Arquitectura, tokens, tipos y reglas: docs/ARQUITECTURA.md
- Escudo: src/assets/logos/escudo-alfa.png (NO recrear ni sustituir)

## Reglas duras
- Solo frontend. Sin backend, sin HTTP externo, sin auth real.
- Los componentes NUNCA tocan los arreglos mock. Todo pasa por src/services/*.
- Dinero en céntimos (enteros). Fechas ISO (YYYY-MM-DD). Un "reloj simulado" en store.
- Estados económicos DERIVADOS, nunca guardados a mano.
- Sin hex sueltos en componentes: solo tokens/variables.
- Sin `any` indiscriminado, sin botones muertos, sin datos duplicados.
- No se borra historial: retiro/anulación/reversión, nunca delete físico.
- Código y textos de UI en español.

## Forma de trabajar
- Una etapa a la vez, en el orden del Master Prompt (sección 23).
- Al terminar cada módulo: `npm run build` y `npm run lint` sin errores, commit con mensaje claro.
- Antes de pasar al siguiente módulo, verificar que el anterior cumple los criterios de aceptación (sección 22).
- Si una decisión del prompt es deficiente, proponer la corrección y explicarla antes de aplicarla.
```

### 2.2 Prompt corto para pegar en Claude Code

```text
Lee CLAUDE.md, docs/MASTER_PROMPT.md y docs/ARQUITECTURA.md.
Ejecuta ETAPA 1 (auditoría del proyecto Vite actual) y ETAPA 2 (planificación) y
muéstrame el plan antes de escribir código de módulos. Luego implementa en este orden:
design system + tokens, layout, capa de servicios mock + seed, y recién después los módulos.
Instala las dependencias del stack indicado. Al terminar cada módulo corre build y lint.
```

---

## 3. Design tokens

### 3.1 `src/styles/tokens.css`

```css
:root {
  /* Marca */
  --color-brand-900: #172B4D;   /* azul oscuro */
  --color-brand-700: #173D91;   /* azul institucional */
  --color-brand-500: #168AC4;   /* azul complementario */
  --color-accent-600: #D92735;  /* rojo institucional (acento/alertas) */
  --color-surface: #FFFFFF;
  --color-bg: #F4F6FA;

  /* Texto y bordes */
  --color-text: var(--color-brand-900);
  --color-text-muted: #5B6B8C;
  --color-border: #E2E7F0;

  /* Semánticos (derivados de la marca, suaves) */
  --color-success-600: #1E8E5A;
  --color-success-50:  #E7F6EE;
  --color-warning-600: #B7791F;
  --color-warning-50:  #FDF3E0;
  --color-danger-600:  var(--color-accent-600);
  --color-danger-50:   #FCE9EB;
  --color-info-600:    var(--color-brand-500);
  --color-info-50:     #E6F3FA;

  /* Forma y elevación */
  --radius-sm: 6px;  --radius-md: 10px;  --radius-lg: 16px;
  --shadow-sm: 0 1px 2px rgb(23 43 77 / .06);
  --shadow-md: 0 4px 16px rgb(23 43 77 / .08);
  --shadow-lg: 0 12px 32px rgb(23 43 77 / .14);

  /* Layout */
  --sidebar-w: 264px;
  --sidebar-w-collapsed: 76px;
  --header-h: 64px;
}

@media (prefers-reduced-motion: reduce) {
  * { animation-duration: .01ms !important; transition-duration: .01ms !important; }
}
```

### 3.2 `tailwind.config.ts` (extender el tema leyendo las variables)

```ts
import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: { 900: 'var(--color-brand-900)', 700: 'var(--color-brand-700)', 500: 'var(--color-brand-500)' },
        accent: { 600: 'var(--color-accent-600)' },
        surface: 'var(--color-surface)',
        app: 'var(--color-bg)',
        muted: 'var(--color-text-muted)',
        line: 'var(--color-border)',
        success: { 600: 'var(--color-success-600)', 50: 'var(--color-success-50)' },
        warning: { 600: 'var(--color-warning-600)', 50: 'var(--color-warning-50)' },
        danger:  { 600: 'var(--color-danger-600)',  50: 'var(--color-danger-50)' },
        info:    { 600: 'var(--color-info-600)',    50: 'var(--color-info-50)' },
      },
      borderRadius: { sm: 'var(--radius-sm)', md: 'var(--radius-md)', lg: 'var(--radius-lg)' },
      boxShadow: { sm: 'var(--shadow-sm)', md: 'var(--shadow-md)', lg: 'var(--shadow-lg)' },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
    },
  },
} satisfies Config;
```

Nota: Inter se instala con `@fontsource-variable/inter` (sin CDN, en línea con "sin servicios externos").

### 3.3 Guía visual

- Azul domina: sidebar `brand-900`, acciones primarias `brand-700`, enlaces e info `brand-500`.
- Rojo solo para: acciones destructivas, alertas, deudas vencidas (en badges y números, no en fondos grandes).
- Badges de estado con fondo `-50` y texto `-600`.

---

## 4. Modelo de datos (`src/types/`)

```ts
export type ID = string;
export type ISODate = string;      // 'YYYY-MM-DD'
export type ISODateTime = string;  // ISO 8601
export type Centimos = number;     // dinero en enteros: S/ 150.00 = 15000

// ---------- Académico ----------
export type NivelId = 'PRIMARIA' | 'SECUNDARIA';

export interface AnioAcademico {
  id: ID; nombre: string;              // '2026'
  fechaInicio: ISODate; fechaFin: ISODate;
  estado: 'PLANIFICADO' | 'ACTIVO' | 'CERRADO';
  configEconomica: ConfigEconomica;
}

export interface Grado {
  id: ID; nivel: NivelId;
  orden: number;                       // 1..6 primaria, 1..5 secundaria
  nombre: string;                      // 'Tercero de primaria'
}

export interface Seccion {
  id: ID; anioId: ID; gradoId: ID;
  nombre: string;                      // 'A', 'B'
  capacidad: number;
  estado: 'ABIERTA' | 'CERRADA';
}
// vacantes = capacidad - matrículas MATRICULADO|PENDIENTE de esa sección (derivado)

// ---------- Personas ----------
export interface Apoderado {
  id: ID; dni: string; nombres: string; apellidos: string;
  parentesco: string; telefono: string; email?: string; direccion?: string;
}

export interface Estudiante {
  id: ID; codigo: string;              // 'EST-0001'
  dni: string; nombres: string;
  apellidoPaterno: string; apellidoMaterno: string;
  fechaNacimiento: ISODate; sexo: 'M' | 'F';
  direccion: string; telefono?: string; email?: string;
  fotoUrl?: string;
  apoderadoPrincipalId: ID; apoderadosIds: ID[];
  observaciones?: string;
  estado: 'ACTIVO' | 'INACTIVO' | 'RETIRADO';   // nunca se elimina
}

// ---------- Matrícula ----------
export type EstadoMatricula =
  'PENDIENTE' | 'MATRICULADO' | 'RETIRADO' | 'ANULADO' | 'FINALIZADO';

export interface Matricula {
  id: ID; estudianteId: ID; anioId: ID; seccionId: ID;  // grado se obtiene por la sección
  estado: EstadoMatricula;
  fechaMatricula: ISODate;
  condicionEconomica: CondicionEconomica;
  motivoCambioEstado?: string;         // retiro/anulación
  fechaCambioEstado?: ISODate;
}

// ---------- Economía ----------
export interface ConfigEconomica {
  importeMatricula: Centimos;
  importeMensualidad: Centimos;
  numeroCuotas: number;                // p. ej. 10
  mesInicio: number;                   // 3 = marzo
  diaVencimiento: number;              // 1..28
}

export interface CondicionEconomica {
  descuentoMatriculaPct: number;       // 0..100
  descuentoMensualidadPct: number;
  exoneradoMatricula: boolean;
  notas?: string;
}

export type ConceptoEconomico = 'MATRICULA' | 'MENSUALIDAD';

export interface Obligacion {
  id: ID; matriculaId: ID;
  concepto: ConceptoEconomico;
  periodo: string;                     // '2026-03' o 'MATRICULA-2026'
  importeOriginal: Centimos;           // ya con descuentos aplicados
  fechaVencimiento: ISODate;
  anulada: boolean;                    // única "bandera" guardada; el resto se deriva
}

export type MetodoPago = 'EFECTIVO' | 'TRANSFERENCIA' | 'YAPE' | 'PLIN' | 'OTRO';

export interface Pago {
  id: ID; numeroComprobante: string;   // 'PAG-2026-000123'
  estudianteId: ID;
  fechaPago: ISODate; metodo: MetodoPago;
  numeroOperacion?: string; observaciones?: string;
  total: Centimos;
  estado: 'CONFIRMADO' | 'REVERTIDO';
  motivoReversion?: string; fechaReversion?: ISODate;
}

export interface DetallePago {
  id: ID; pagoId: ID; obligacionId: ID; importe: Centimos;
}

// ---------- Administración ----------
export type RolId = 'ADMINISTRADOR' | 'DIRECCION' | 'SECRETARIA' | 'TESORERIA';

export interface Usuario {
  id: ID; nombre: string; email: string; rol: RolId; activo: boolean;
}

export interface EventoAuditoria {          // inmutable: sin update ni delete
  id: ID; usuarioId: ID; fechaHora: ISODateTime;
  accion: 'CREAR' | 'EDITAR' | 'MATRICULAR' | 'RETIRAR' | 'ANULAR'
        | 'PAGAR' | 'REVERTIR_PAGO' | 'CONFIG_ECONOMICA';
  modulo: string; entidad: string; entidadId: ID; descripcion: string;
}
```

### Valores derivados (funciones puras en `src/utils/finanzas.ts`, nunca guardados)

```ts
pagado(ob)   = suma de DetallePago.importe de pagos CONFIRMADOS de esa obligación
saldo(ob)    = importeOriginal - pagado(ob)               // nunca < 0
estado(ob, hoy):
  si ob.anulada                          → 'ANULADA'
  si saldo === 0                         → 'PAGADA'
  si pagado > 0 y vence < hoy            → 'VENCIDA'      // vencida con pago parcial
  si pagado > 0                          → 'PARCIAL'
  si vence < hoy                         → 'VENCIDA'
  si vence > hoy + 30 días               → 'PROGRAMADA'
  en otro caso                           → 'PENDIENTE'
```

Importante: el dashboard, el estado de cuenta, deudas y reportes usan SOLO estas funciones. Así no pueden contradecirse.

---

## 5. Reglas de negocio

**Matrícula**
- Una sola matrícula no anulada por estudiante y año (`estudianteId + anioId`).
- Solo se matricula en secciones `ABIERTA` con vacantes > 0.
- Transiciones permitidas:
  - `PENDIENTE → MATRICULADO | ANULADO`
  - `MATRICULADO → RETIRADO | ANULADO | FINALIZADO`
  - `RETIRADO`, `ANULADO`, `FINALIZADO` son terminales.
- Retiro y anulación exigen motivo y conservan todo el historial.
- Al confirmar (paso 4 del asistente): se crean en una sola operación la matrícula, la obligación de matrícula y las N mensualidades, y se registra auditoría.
- Al retirar o anular: las obligaciones sin pagos pasan a `anulada = true`; las que tienen pagos se conservan (el colegio decide después, no se pierde dinero registrado).

**Obligaciones**
- Mensualidad k vence el día `diaVencimiento` del mes `mesInicio + k`.
- Descuento: `importeOriginal = round(base * (1 - pct/100))`; exoneración deja la matrícula en 0 y no genera obligación.
- Los importes salen de `ConfigEconomica` del año (editable). No hay tarifas fijas en código.

**Pagos**
- Un pago puede tener varios `DetallePago` (se aplica a varias obligaciones).
- Cada `DetallePago.importe` ≤ `saldo` de su obligación al registrar. Sin sobrepagos.
- La suma de detalles = `Pago.total`. Un pago sin detalles no se puede guardar.
- Duplicados: se rechaza un pago con mismo estudiante + método + número de operación (cuando el método lo requiere).
- Los pagos no se borran. Se revierten: `estado = REVERTIDO` con motivo; los saldos se recalculan solos porque `pagado()` solo cuenta pagos CONFIRMADOS.

**Auditoría**
- Solo `auditService.registrar()` y `listar()`. No existen `editar` ni `eliminar`.

**Permisos (matriz base, ajustable)**

| Acción | Admin | Dirección | Secretaría | Tesorería |
|---|---|---|---|---|
| Ver dashboard y reportes | ✓ | ✓ | ✓ (acad.) | ✓ (econ.) |
| Gestionar estudiantes y matrículas | ✓ | ✓ | ✓ | ✗ |
| Registrar / revertir pagos | ✓ | ✗ | ✗ | ✓ |
| Config. económica y académica | ✓ | ✓ | ✗ | ✗ |
| Usuarios y auditoría | ✓ | ✓ (solo ver) | ✗ | ✗ |

Se aplica con un hook `usePermiso('pagos.registrar')` y un componente `<Can>` que oculta o deshabilita.

---

## 6. Patrón de servicios mock

Objetivo: que cambiar a HTTP real sea reemplazar la implementación, no la UI.

```ts
// src/services/student/studentService.ts  (interfaz estable)
export interface StudentService {
  listar(filtros: FiltrosEstudiante): Promise<Pagina<Estudiante>>;
  obtener(id: ID): Promise<Estudiante>;
  crear(dto: NuevoEstudiante): Promise<Estudiante>;
  actualizar(id: ID, dto: Partial<NuevoEstudiante>): Promise<Estudiante>;
  cambiarEstado(id: ID, estado: Estudiante['estado'], motivo: string): Promise<Estudiante>;
}
```

- Implementación mock en `studentService.mock.ts`, exportada como `studentService` desde `index.ts`. Mañana se cambia por `studentService.http.ts`.
- Un helper `simular(fn, { min: 150, max: 450, falloProb: 0 })` añade latencia y permite forzar errores en pruebas.
- `src/mocks/db.ts`: único lugar con las colecciones en memoria + `cargar()` / `guardar()` a localStorage (clave versionada: `iepalfa:v1`) + `restablecer()` que vuelve al seed.
- Los servicios devuelven copias (structuredClone), nunca referencias al arreglo original.
- Cada servicio que muta llama a `auditService.registrar()` dentro de la misma operación.
- Errores de negocio: clase `ErrorNegocio(codigo, mensaje)`; la UI los muestra con Sonner.
- Estado de servidor en la UI: TanStack Query recomendado (cache + invalidación tras mutaciones). Zustand queda para UI (sidebar, usuario simulado, año seleccionado, reloj simulado).

---

## 7. Plan del seed (`src/mocks/seeds/`)

Debe ser **determinista** (misma semilla = mismos datos) para poder reproducir errores.

- Usa un generador con semilla (p. ej. `mulberry32`) y listas de nombres y apellidos peruanos comunes. DNI ficticios de 8 dígitos que empiecen con `9` (para no coincidir con reales).
- Años: 2025 (CERRADO), 2026 (ACTIVO), 2027 (PLANIFICADO).
- Grados: los 11 fijos. Secciones: 2 por grado (A, B), capacidad 25 a 30, algunas casi llenas para probar vacantes.
- Estudiantes: 48 a 60, con 1 apoderado principal; algunos hermanos comparten apoderado.
- Matrículas:
  - Cerca de 40 en 2026 (mayoría MATRICULADO, 2 o 3 RETIRADO, 1 ANULADO, 2 PENDIENTE).
  - Cerca de 20 en 2025 (FINALIZADO) de los mismos estudiantes, un grado menos, para mostrar historial.
- Reloj simulado en la fecha actual del sistema, de modo que haya cuotas vencidas, parciales, al día y programadas.
- Pagos: generados siguiendo perfiles (al día, un atraso, deuda grave, pagos parciales, un pago multi-cuota, 2 o 3 pagos revertidos).
- Auditoría: se produce al ejecutar el propio seed pasando por los servicios (así hay eventos realistas desde el inicio).
- Importes: parámetros de ejemplo en `ConfigEconomica`, claramente marcados como demostrativos.

---

## 8. Orden de trabajo y validación

### Orden sugerido (cada paso con build verde antes del siguiente)
1. Tokens, Tailwind, componentes `ui/` base, layout (sidebar, header, rutas con lazy loading).
2. Tipos, `db.ts`, utilidades de finanzas (con pruebas unitarias: Vitest) y seed.
3. Servicios mock + auditoría + permisos.
4. Estudiantes, estructura académica.
5. Matrículas (asistente de 4 pasos) y generación de obligaciones.
6. Mensualidades, pagos, estados de cuenta, deudas.
7. Dashboard y reportes (consumiendo solo las funciones derivadas).
8. Auditoría, usuarios y configuración, restablecer demo.
9. Refinamiento visual, responsive, accesibilidad, rendimiento.

### Pruebas unitarias que no deben faltar (Vitest)
- `estado(ob, hoy)` en todos sus casos de borde (hoy = vencimiento, pago parcial vencido, anulada).
- Pago mayor al saldo es rechazado.
- Reversión de pago restaura el saldo.
- Matrícula duplicada es rechazada; transición inválida es rechazada.
- Suma del dashboard = suma de la tabla de deudas y pagos.

### Recorrido extremo a extremo (manual)
1. Registrar estudiante nuevo → aparece en lista y en auditoría.
2. Matricularlo (sección con vacantes) → se crean matrícula + 1 + N obligaciones.
3. Pago parcial de la matrícula → estado PARCIAL, saldo correcto en estado de cuenta, dashboard actualizado.
4. Pago que cubre varias cuotas → varios detalles, todo PAGADA.
5. Revertir el pago → saldos vuelven, historial conserva ambos movimientos.
6. Retirar al estudiante → obligaciones sin pagos anuladas, historial intacto.
7. Recargar la página → datos persisten. "Restablecer demo" → vuelve al seed.
8. Cambiar de usuario simulado (Tesorería) → no ve acciones de matrícula.

### Checklist de aceptación rápido
- [ ] `npm run build` y `npm run lint` sin errores
- [ ] Sin hex sueltos (buscar `#[0-9A-Fa-f]{6}` fuera de `tokens.css`)
- [ ] Sin imports de `mocks/data` desde `features/` o `components/`
- [ ] Sin `any` injustificados
- [ ] Todas las rutas del sidebar cargan; ningún botón sin acción
- [ ] Móvil: sidebar como drawer, tablas sin desbordar la página
