import type {
  AnioAcademico, Apoderado, ConfigEconomica, DetallePago, Estudiante, EventoAuditoria,
  Grado, Matricula, Obligacion, Pago, Seccion,
} from '@/types';
import { METODOS } from '@/constants/metodos';
import { sumarDias } from '@/utils/finanzas';
import { pad } from '@/utils/formato';
import { generarObligaciones } from '@/utils/obligaciones';

export interface DB {
  anios: AnioAcademico[];
  grados: Grado[];
  secciones: Seccion[];
  apoderados: Apoderado[];
  estudiantes: Estudiante[];
  matriculas: Matricula[];
  obligaciones: Obligacion[];
  pagos: Pago[];
  detalles: DetallePago[];
  auditoria: EventoAuditoria[];
}

/** Fecha "de hoy" del sistema (reloj simulado = reloj real). */
export const HOY = new Date().toISOString().slice(0, 10);
const KEY = 'iepalfa:v1';

const NOMBRES = ['Luis', 'Ana', 'Carlos', 'María', 'José', 'Lucía', 'Diego', 'Camila', 'Mateo', 'Valeria', 'Andrés', 'Sofía', 'Jorge', 'Daniela', 'Pedro', 'Fernanda', 'Miguel', 'Gabriela', 'Rafael', 'Alejandra'];
const APELLIDOS = ['Quispe', 'Torres', 'Rojas', 'Flores', 'Vargas', 'Castro', 'Mendoza', 'Ramos', 'Salazar', 'Herrera', 'Paredes', 'Cruz', 'Ortiz', 'Silva', 'Reyes', 'Vega', 'Cabrera', 'Guerra', 'Navarro', 'Soto'];
const ORDINALES = ['Primero', 'Segundo', 'Tercero', 'Cuarto', 'Quinto', 'Sexto'];

function buildSeed(): DB {
  // Importes de DEMOSTRACIÓN (configurables por año académico).
  const cfg: ConfigEconomica = { importeMatricula: 30000, importeMensualidad: 25000, numeroCuotas: 10, mesInicio: 3, diaVencimiento: 10 };
  const anios: AnioAcademico[] = ['2026', '2027'].map((n, k) => ({
    id: `a-${n}`, nombre: n, fechaInicio: `${n}-03-01`, fechaFin: `${n}-12-20`,
    estado: k === 0 ? 'ACTIVO' : 'PLANIFICADO', configEconomica: { ...cfg },
  }));
  const grados: Grado[] = [
    ...ORDINALES.map((o, i): Grado => ({ id: `g-p${i + 1}`, nivel: 'PRIMARIA', orden: i + 1, nombre: `${o} de primaria` })),
    ...ORDINALES.slice(0, 5).map((o, i): Grado => ({ id: `g-s${i + 1}`, nivel: 'SECUNDARIA', orden: i + 1, nombre: `${o} de secundaria` })),
  ];
  const secciones: Seccion[] = [];
  for (const a of anios) for (const g of grados) for (const l of ['A', 'B'])
    secciones.push({ id: `s-${a.nombre}-${g.id}-${l}`, anioId: a.id, gradoId: g.id, nombre: l, capacidad: 30, estado: 'ABIERTA' });

  const d: DB = { anios, grados, secciones, apoderados: [], estudiantes: [], matriculas: [], obligaciones: [], pagos: [], detalles: [], auditoria: [] };
  let n = 0;
  const pagar = (ob: Obligacion, estId: string, importe: number, fecha: string, i: number): void => {
    n += 1;
    const metodo = METODOS[(i + n) % METODOS.length];
    d.pagos.push({
      id: `pg-${n}`, numeroComprobante: `PAG-2026-${pad(n, 6)}`, estudianteId: estId, fechaPago: fecha, metodo,
      numeroOperacion: metodo === 'EFECTIVO' ? undefined : `OP${100000 + n * 37}`, total: importe, estado: 'CONFIRMADO',
    });
    d.detalles.push({ id: `dp-${n}`, pagoId: `pg-${n}`, obligacionId: ob.id, importe });
  };

  for (let i = 0; i < 40; i++) {
    const g = grados[i % 11];
    const letra = Math.floor(i / 11) % 2 === 0 ? 'A' : 'B';
    const estId = `e-${i + 1}`;
    const mId = `m-${i + 1}`;
    const apPat = APELLIDOS[(i * 3) % 20];
    const apMat = APELLIDOS[(i * 7 + 1) % 20];
    const edad = 6 + (i % 11);
    d.apoderados.push({
      id: `ap-${i + 1}`, dni: `7${pad((i * 7919 + 2345678) % 10000000, 7)}`, nombres: NOMBRES[(i + 5) % 20],
      apellidos: `${apPat} ${APELLIDOS[(i * 5 + 2) % 20]}`, parentesco: i % 2 === 0 ? 'Madre' : 'Padre',
      telefono: `9${pad((i * 7919 + 1234567) % 100000000, 8)}`,
    });
    d.estudiantes.push({
      id: estId, codigo: `EST-${pad(i + 1, 4)}`, dni: `9${pad((i * 7919 + 1234567) % 10000000, 7)}`,
      nombres: NOMBRES[i % 20], apellidoPaterno: apPat, apellidoMaterno: apMat,
      fechaNacimiento: `${2026 - edad}-${pad(1 + (i % 12))}-${pad(1 + ((i * 3) % 28))}`,
      sexo: i % 2 === 0 ? 'M' : 'F', direccion: `Av. Demo ${100 + i}, Lima`,
      apoderadoPrincipalId: `ap-${i + 1}`, apoderadosIds: [`ap-${i + 1}`], estado: 'ACTIVO',
    });
    const m: Matricula = {
      id: mId, estudianteId: estId, anioId: 'a-2026', seccionId: `s-2026-${g.id}-${letra}`, estado: 'MATRICULADO',
      fechaMatricula: `2026-02-${pad(1 + (i % 20))}`,
      condicionEconomica: { descuentoMatriculaPct: 0, descuentoMensualidadPct: i % 9 === 0 ? 10 : 0, exoneradoMatricula: false },
    };
    d.matriculas.push(m);
    const obs = generarObligaciones(m, cfg, '2026');
    d.obligaciones.push(...obs);

    const fechaPago = (o: Obligacion): string => {
      const f = sumarDias(o.fechaVencimiento, -(i % 5));
      return f < HOY ? f : HOY;
    };
    const pagarTodo = (lista: Obligacion[]): void => lista.forEach((o) => pagar(o, estId, o.importeOriginal, fechaPago(o), i));
    const vencidas = obs.filter((o) => o.fechaVencimiento <= HOY);
    const perfil = i % 5; // 0 y 4: al día · 1: 2 cuotas atrasadas · 2: cuota parcial + atraso · 3: solo matrícula
    if (perfil === 0 || perfil === 4) pagarTodo(vencidas);
    if (perfil === 4) {
      const proxima = obs.find((o) => o.fechaVencimiento > HOY);
      if (proxima) pagar(proxima, estId, proxima.importeOriginal, HOY, i);
    }
    if (perfil === 1) pagarTodo(vencidas.slice(0, -2));
    if (perfil === 2) {
      const base = vencidas.slice(0, -1);
      pagarTodo(base.slice(0, -1));
      const p = base[base.length - 1];
      if (p) pagar(p, estId, Math.round(p.importeOriginal * 0.4), fechaPago(p), i);
    }
    if (perfil === 3) pagarTodo(vencidas.slice(0, 1));

    if (i % 13 === 5) {
      m.estado = 'RETIRADO';
      m.motivoCambioEstado = 'Traslado de ciudad (demo)';
      m.fechaCambioEstado = '2026-08-15';
      d.estudiantes[d.estudiantes.length - 1].estado = 'RETIRADO';
      obs.forEach((o) => { if (!d.detalles.some((x) => x.obligacionId === o.id)) o.anulada = true; });
    }
    d.auditoria.push({
      id: `au-${i + 1}`, usuarioId: 'u-admin', fechaHora: `${m.fechaMatricula}T09:${pad(i % 60)}:00`, accion: 'MATRICULAR',
      modulo: 'Matrículas', entidad: 'Matricula', entidadId: mId, descripcion: `Matrícula 2026 de ${NOMBRES[i % 20]} ${apPat}`,
    });
  }
  return d;
}

let db: DB | null = null;

export function save(): void {
  try { if (db) localStorage.setItem(KEY, JSON.stringify(db)); } catch { /* sin almacenamiento disponible */ }
}

export function getDB(): DB {
  if (!db) {
    try {
      const raw = localStorage.getItem(KEY);
      db = raw ? (JSON.parse(raw) as DB) : null;
    } catch { db = null; }
    if (!db) { db = buildSeed(); save(); }
  }
  return db;
}

export function restablecer(): void {
  db = buildSeed();
  save();
}
