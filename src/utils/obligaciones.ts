import type { ConfigEconomica, Matricula, Obligacion } from '@/types';
import { pad } from './formato';

/** Genera matrícula + mensualidades a partir de la configuración económica del año. */
export function generarObligaciones(m: Matricula, cfg: ConfigEconomica, anio: string): Obligacion[] {
  const c = m.condicionEconomica;
  const lista: Obligacion[] = [];
  if (!c.exoneradoMatricula) {
    lista.push({
      id: `ob-${m.id}-mat`,
      matriculaId: m.id,
      concepto: 'MATRICULA',
      periodo: `Matrícula ${anio}`,
      importeOriginal: Math.round(cfg.importeMatricula * (1 - c.descuentoMatriculaPct / 100)),
      fechaVencimiento: `${anio}-${pad(cfg.mesInicio - 1)}-${pad(cfg.diaVencimiento)}`,
      anulada: false,
    });
  }
  for (let k = 0; k < cfg.numeroCuotas; k++) {
    const mes = cfg.mesInicio + k;
    lista.push({
      id: `ob-${m.id}-${pad(k + 1)}`,
      matriculaId: m.id,
      concepto: 'MENSUALIDAD',
      periodo: `${anio}-${pad(mes)}`,
      importeOriginal: Math.round(cfg.importeMensualidad * (1 - c.descuentoMensualidadPct / 100)),
      fechaVencimiento: `${anio}-${pad(mes)}-${pad(cfg.diaVencimiento)}`,
      anulada: false,
    });
  }
  return lista;
}
