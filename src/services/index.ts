import { getDB, HOY, restablecer, save, type DB } from '@/mocks/db';
import type {
  EstadoMatricula, EstadoObligacion, Estudiante, EventoAuditoria, MetodoPago, Obligacion, Pago,
} from '@/types';
import { estadoObligacion, pagado, saldo } from '@/utils/finanzas';
import { mesCorto, pad } from '@/utils/formato';
import { generarObligaciones } from '@/utils/obligaciones';

export class ErrorNegocio extends Error {}
export const mensaje = (e: unknown): string => (e instanceof Error ? e.message : 'Error inesperado');

/** Simula una API asíncrona: latencia corta y copia de los datos (los componentes nunca reciben referencias al "servidor"). */
function sim<T>(fn: () => T): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    setTimeout(() => {
      try { resolve(structuredClone(fn())); } catch (e) { reject(e); }
    }, 120);
  });
}

function auditar(d: DB, accion: EventoAuditoria['accion'], modulo: string, entidad: string, entidadId: string, descripcion: string): void {
  d.auditoria.push({
    id: `au-${Date.now()}-${d.auditoria.length}`, usuarioId: 'u-admin', fechaHora: new Date().toISOString(),
    accion, modulo, entidad, entidadId, descripcion,
  });
}

const nombreEst = (e: Estudiante): string => `${e.nombres} ${e.apellidoPaterno} ${e.apellidoMaterno}`;

// ---------- Vistas derivadas ----------
export interface ObligacionVista extends Obligacion {
  pagado: number; saldo: number; estado: EstadoObligacion;
  estudianteId: string; estudiante: string; dni: string; grado: string; seccion: string; anio: string;
}

function vistas(d: DB): ObligacionVista[] {
  const ests = new Map(d.estudiantes.map((e) => [e.id, e]));
  const mats = new Map(d.matriculas.map((m) => [m.id, m]));
  const secs = new Map(d.secciones.map((s) => [s.id, s]));
  const grs = new Map(d.grados.map((g) => [g.id, g]));
  const ans = new Map(d.anios.map((a) => [a.id, a]));
  return d.obligaciones.map((ob) => {
    const m = mats.get(ob.matriculaId)!;
    const e = ests.get(m.estudianteId)!;
    const s = secs.get(m.seccionId)!;
    const p = pagado(ob, d.detalles, d.pagos);
    return {
      ...ob, pagado: p, saldo: saldo(ob, p), estado: estadoObligacion(ob, p, HOY),
      estudianteId: e.id, estudiante: nombreEst(e), dni: e.dni, grado: grs.get(s.gradoId)?.nombre ?? '', seccion: s.nombre,
      anio: ans.get(m.anioId)?.nombre ?? '',
    };
  });
}

export interface EstudianteFila extends Estudiante {
  apoderado: string; telefonoApoderado: string; grado: string; seccion: string; estadoMatricula: string;
}
export interface MatriculaFila {
  id: string; estudiante: string; dni: string; anio: string; grado: string; seccion: string; estado: EstadoMatricula; fecha: string; motivo?: string;
}
export interface PagoFila extends Pago { estudiante: string; conceptos: string }
export interface Resumen {
  totalEstudiantes: number; matriculados: number; ingresos: number; pendiente: number; vencido: number; deudores: number;
  recaudacionMes: number; ingresosMes: { mes: string; total: number }[]; estados: { estado: string; cantidad: number }[]; ultimosPagos: PagoFila[];
}
export interface NuevoEstudiante {
  dni: string; nombres: string; apellidoPaterno: string; apellidoMaterno: string; fechaNacimiento: string; sexo: 'M' | 'F'; direccion: string;
  apoDni: string; apoNombres: string; apoApellidos: string; apoParentesco: string; apoTelefono: string;
}

const TRANSICIONES: Record<EstadoMatricula, EstadoMatricula[]> = {
  PENDIENTE: ['MATRICULADO', 'ANULADO'], MATRICULADO: ['RETIRADO', 'ANULADO', 'FINALIZADO'], RETIRADO: [], ANULADO: [], FINALIZADO: [],
};

function filaPago(d: DB, p: Pago): PagoFila {
  const e = d.estudiantes.find((x) => x.id === p.estudianteId);
  const periodos = d.detalles.filter((x) => x.pagoId === p.id)
    .map((x) => d.obligaciones.find((o) => o.id === x.obligacionId)?.periodo ?? '').join(', ');
  return { ...p, estudiante: e ? nombreEst(e) : '—', conceptos: periodos };
}

export const api = {
  restablecer: (): Promise<void> => sim(() => restablecer()),

  listarAnios: () => sim(() => getDB().anios.map((a) => ({ id: a.id, nombre: a.nombre }))),

  listarEstudiantes: (): Promise<EstudianteFila[]> => sim(() => {
    const d = getDB();
    const activo = d.anios.find((a) => a.estado === 'ACTIVO');
    return d.estudiantes.map((e): EstudianteFila => {
      const ap = d.apoderados.find((a) => a.id === e.apoderadoPrincipalId);
      const m = d.matriculas.find((x) => x.estudianteId === e.id && x.anioId === activo?.id && x.estado !== 'ANULADO');
      const s = m ? d.secciones.find((x) => x.id === m.seccionId) : undefined;
      const g = s ? d.grados.find((x) => x.id === s.gradoId) : undefined;
      return {
        ...e, apoderado: ap ? `${ap.nombres} ${ap.apellidos}` : '—', telefonoApoderado: ap?.telefono ?? '—',
        grado: g?.nombre ?? '—', seccion: s?.nombre ?? '—', estadoMatricula: m?.estado ?? 'SIN MATRÍCULA',
      };
    });
  }),

  crearEstudiante: (f: NuevoEstudiante): Promise<Estudiante> => sim(() => {
    const d = getDB();
    if (!/^\d{8}$/.test(f.dni)) throw new ErrorNegocio('El DNI del estudiante debe tener 8 dígitos');
    if (!/^\d{8}$/.test(f.apoDni)) throw new ErrorNegocio('El DNI del apoderado debe tener 8 dígitos');
    if (!f.nombres.trim() || !f.apellidoPaterno.trim() || !f.apellidoMaterno.trim()) throw new ErrorNegocio('Completa nombres y apellidos');
    if (!f.fechaNacimiento) throw new ErrorNegocio('Indica la fecha de nacimiento');
    if (!f.apoNombres.trim() || !f.apoApellidos.trim() || !/^\d{9}$/.test(f.apoTelefono)) throw new ErrorNegocio('Datos del apoderado incompletos (teléfono de 9 dígitos)');
    if (d.estudiantes.some((e) => e.dni === f.dni)) throw new ErrorNegocio('Ya existe un estudiante con ese DNI');
    let ap = d.apoderados.find((a) => a.dni === f.apoDni);
    if (!ap) {
      ap = { id: `ap-${Date.now()}`, dni: f.apoDni, nombres: f.apoNombres.trim(), apellidos: f.apoApellidos.trim(), parentesco: f.apoParentesco || 'Apoderado', telefono: f.apoTelefono };
      d.apoderados.push(ap);
    }
    const est: Estudiante = {
      id: `e-${Date.now()}`, codigo: `EST-${pad(d.estudiantes.length + 1, 4)}`, dni: f.dni, nombres: f.nombres.trim(),
      apellidoPaterno: f.apellidoPaterno.trim(), apellidoMaterno: f.apellidoMaterno.trim(), fechaNacimiento: f.fechaNacimiento,
      sexo: f.sexo, direccion: f.direccion.trim() || '—', apoderadoPrincipalId: ap.id, apoderadosIds: [ap.id], estado: 'ACTIVO',
    };
    d.estudiantes.push(est);
    auditar(d, 'CREAR', 'Estudiantes', 'Estudiante', est.id, `Registro del estudiante ${nombreEst(est)}`);
    save();
    return est;
  }),

  secciones: (anioId: string) => sim(() => {
    const d = getDB();
    return d.secciones.filter((s) => s.anioId === anioId).map((s) => {
      const ocupadas = d.matriculas.filter((m) => m.seccionId === s.id && (m.estado === 'MATRICULADO' || m.estado === 'PENDIENTE')).length;
      const g = d.grados.find((x) => x.id === s.gradoId);
      return { id: s.id, etiqueta: `${g?.nombre ?? ''} · Sección ${s.nombre}`, vacantes: s.capacidad - ocupadas };
    });
  }),

  listarMatriculas: (): Promise<MatriculaFila[]> => sim(() => {
    const d = getDB();
    return [...d.matriculas].reverse().map((m): MatriculaFila => {
      const e = d.estudiantes.find((x) => x.id === m.estudianteId)!;
      const s = d.secciones.find((x) => x.id === m.seccionId)!;
      return {
        id: m.id, estudiante: nombreEst(e), dni: e.dni, anio: d.anios.find((a) => a.id === m.anioId)?.nombre ?? '',
        grado: d.grados.find((g) => g.id === s.gradoId)?.nombre ?? '', seccion: s.nombre, estado: m.estado, fecha: m.fechaMatricula, motivo: m.motivoCambioEstado,
      };
    });
  }),

  matricular: (p: { estudianteId: string; seccionId: string; descuentoMensualidadPct: number }) => sim(() => {
    const d = getDB();
    const est = d.estudiantes.find((e) => e.id === p.estudianteId);
    const sec = d.secciones.find((s) => s.id === p.seccionId);
    if (!est || !sec) throw new ErrorNegocio('Selecciona un estudiante y una sección');
    const anio = d.anios.find((a) => a.id === sec.anioId)!;
    if (!(p.descuentoMensualidadPct >= 0 && p.descuentoMensualidadPct <= 100)) throw new ErrorNegocio('El descuento debe estar entre 0 y 100');
    if (d.matriculas.some((m) => m.estudianteId === est.id && m.anioId === anio.id && m.estado !== 'ANULADO'))
      throw new ErrorNegocio(`${nombreEst(est)} ya tiene una matrícula en ${anio.nombre}`);
    if (sec.estado !== 'ABIERTA') throw new ErrorNegocio('La sección está cerrada');
    const ocupadas = d.matriculas.filter((m) => m.seccionId === sec.id && (m.estado === 'MATRICULADO' || m.estado === 'PENDIENTE')).length;
    if (ocupadas >= sec.capacidad) throw new ErrorNegocio('La sección no tiene vacantes');
    const m = {
      id: `m-${Date.now()}`, estudianteId: est.id, anioId: anio.id, seccionId: sec.id, estado: 'MATRICULADO' as EstadoMatricula, fechaMatricula: HOY,
      condicionEconomica: { descuentoMatriculaPct: 0, descuentoMensualidadPct: p.descuentoMensualidadPct, exoneradoMatricula: false },
    };
    d.matriculas.push(m);
    const obs = generarObligaciones(m, anio.configEconomica, anio.nombre);
    d.obligaciones.push(...obs);
    est.estado = 'ACTIVO';
    auditar(d, 'MATRICULAR', 'Matrículas', 'Matricula', m.id, `Matrícula ${anio.nombre} de ${nombreEst(est)} (${obs.length} obligaciones generadas)`);
    save();
    return m.id;
  }),

  cambiarEstado: (matriculaId: string, destino: EstadoMatricula, motivo: string) => sim(() => {
    const d = getDB();
    const m = d.matriculas.find((x) => x.id === matriculaId);
    if (!m) throw new ErrorNegocio('Matrícula no encontrada');
    if (!TRANSICIONES[m.estado].includes(destino)) throw new ErrorNegocio(`No se puede pasar de ${m.estado} a ${destino}`);
    if (!motivo.trim()) throw new ErrorNegocio('Indica el motivo');
    m.estado = destino; m.motivoCambioEstado = motivo.trim(); m.fechaCambioEstado = HOY;
    // Las obligaciones sin pagos se anulan; las que ya tienen pagos se conservan.
    d.obligaciones.filter((o) => o.matriculaId === m.id).forEach((o) => {
      if (pagado(o, d.detalles, d.pagos) === 0) o.anulada = true;
    });
    const est = d.estudiantes.find((e) => e.id === m.estudianteId)!;
    if (destino === 'RETIRADO') est.estado = 'RETIRADO';
    auditar(d, destino === 'RETIRADO' ? 'RETIRAR' : 'ANULAR', 'Matrículas', 'Matricula', m.id, `${destino} · ${nombreEst(est)} · ${motivo.trim()}`);
    save();
  }),

  obligacionesDe: (estudianteId: string): Promise<ObligacionVista[]> =>
    sim(() => vistas(getDB()).filter((v) => v.estudianteId === estudianteId)),

  deudas: (): Promise<ObligacionVista[]> => sim(() =>
    vistas(getDB()).filter((v) => v.saldo > 0 && (v.estado === 'VENCIDA' || v.estado === 'PARCIAL' || v.estado === 'PENDIENTE'))
      .sort((a, b) => a.fechaVencimiento.localeCompare(b.fechaVencimiento))),

  listarPagos: (estudianteId?: string): Promise<PagoFila[]> => sim(() => {
    const d = getDB();
    return d.pagos.filter((p) => !estudianteId || p.estudianteId === estudianteId)
      .sort((a, b) => b.fechaPago.localeCompare(a.fechaPago) || b.id.localeCompare(a.id)).map((p) => filaPago(d, p));
  }),

  registrarPago: (p: { obligacionId: string; importe: number; metodo: MetodoPago; numeroOperacion?: string }) => sim(() => {
    const d = getDB();
    const v = vistas(d).find((x) => x.id === p.obligacionId);
    if (!v) throw new ErrorNegocio('Obligación no encontrada');
    if (v.estado === 'ANULADA') throw new ErrorNegocio('La obligación está anulada');
    if (!Number.isInteger(p.importe) || p.importe <= 0) throw new ErrorNegocio('Ingresa un importe válido');
    if (p.importe > v.saldo) throw new ErrorNegocio('El importe supera el saldo pendiente');
    const op = (p.numeroOperacion ?? '').trim();
    if (p.metodo !== 'EFECTIVO' && !op) throw new ErrorNegocio('Indica el número de operación');
    if (op && d.pagos.some((x) => x.estado === 'CONFIRMADO' && x.metodo === p.metodo && x.numeroOperacion === op))
      throw new ErrorNegocio('Ya existe un pago con ese número de operación');
    const pago: Pago = {
      id: `pg-${Date.now()}`, numeroComprobante: `PAG-${HOY.slice(0, 4)}-${pad(d.pagos.length + 1, 6)}`, estudianteId: v.estudianteId,
      fechaPago: HOY, metodo: p.metodo, numeroOperacion: op || undefined, total: p.importe, estado: 'CONFIRMADO',
    };
    d.pagos.push(pago);
    d.detalles.push({ id: `dp-${Date.now()}`, pagoId: pago.id, obligacionId: v.id, importe: p.importe });
    auditar(d, 'PAGAR', 'Pagos', 'Pago', pago.id, `${pago.numeroComprobante} · ${v.estudiante} · ${v.periodo}`);
    save();
    return pago;
  }),

  revertirPago: (pagoId: string, motivo: string) => sim(() => {
    const d = getDB();
    const p = d.pagos.find((x) => x.id === pagoId);
    if (!p || p.estado !== 'CONFIRMADO') throw new ErrorNegocio('Solo se pueden revertir pagos confirmados');
    if (!motivo.trim()) throw new ErrorNegocio('Indica el motivo');
    p.estado = 'REVERTIDO'; p.motivoReversion = motivo.trim(); p.fechaReversion = HOY;
    auditar(d, 'REVERTIR_PAGO', 'Pagos', 'Pago', p.id, `${p.numeroComprobante} revertido · ${motivo.trim()}`);
    save();
  }),

  auditoria: (): Promise<EventoAuditoria[]> =>
    sim(() => [...getDB().auditoria].sort((a, b) => b.fechaHora.localeCompare(a.fechaHora)).slice(0, 200)),

  dashboard: (): Promise<Resumen> => sim(() => {
    const d = getDB();
    const v = vistas(d);
    const activo = d.anios.find((a) => a.estado === 'ACTIVO');
    const confirmados = d.pagos.filter((p) => p.estado === 'CONFIRMADO');
    const anioHoy = HOY.slice(0, 4);
    const ingresosMes = Array.from({ length: 12 }, (_, k) => ({
      mes: mesCorto(k),
      total: Math.round(confirmados.filter((p) => p.fechaPago.slice(0, 7) === `${anioHoy}-${pad(k + 1)}`).reduce((s, p) => s + p.total, 0) / 100),
    }));
    const conteo = new Map<string, number>();
    v.forEach((x) => conteo.set(x.estado, (conteo.get(x.estado) ?? 0) + 1));
    const vivas = v.filter((x) => x.estado !== 'ANULADA');
    return {
      totalEstudiantes: d.estudiantes.length,
      matriculados: d.matriculas.filter((m) => m.anioId === activo?.id && m.estado === 'MATRICULADO').length,
      ingresos: confirmados.reduce((s, p) => s + p.total, 0),
      pendiente: vivas.reduce((s, x) => s + x.saldo, 0),
      vencido: v.filter((x) => x.estado === 'VENCIDA').reduce((s, x) => s + x.saldo, 0),
      deudores: new Set(v.filter((x) => x.estado === 'VENCIDA').map((x) => x.estudianteId)).size,
      recaudacionMes: confirmados.filter((p) => p.fechaPago.slice(0, 7) === HOY.slice(0, 7)).reduce((s, p) => s + p.total, 0),
      ingresosMes,
      estados: Array.from(conteo, ([estado, cantidad]) => ({ estado, cantidad })),
      ultimosPagos: [...confirmados].sort((a, b) => b.fechaPago.localeCompare(a.fechaPago) || b.id.localeCompare(a.id)).slice(0, 6).map((p) => filaPago(d, p)),
    };
  }),
};
