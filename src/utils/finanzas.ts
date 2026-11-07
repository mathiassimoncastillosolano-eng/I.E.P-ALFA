import type { Centimos, DetallePago, EstadoObligacion, ISODate, Obligacion, Pago } from '@/types';

/** Suma días a una fecha ISO (UTC, sin efectos de zona horaria). */
export function sumarDias(fecha: ISODate, dias: number): ISODate {
  const d = new Date(`${fecha}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

/** Total pagado de una obligación: solo cuentan pagos CONFIRMADOS. */
export function pagado(ob: Obligacion, detalles: DetallePago[], pagos: Pago[]): Centimos {
  const confirmados = new Set(pagos.filter((p) => p.estado === 'CONFIRMADO').map((p) => p.id));
  return detalles
    .filter((d) => d.obligacionId === ob.id && confirmados.has(d.pagoId))
    .reduce((acc, d) => acc + d.importe, 0);
}

export function saldo(ob: Obligacion, pagadoMonto: Centimos): Centimos {
  return Math.max(0, ob.importeOriginal - pagadoMonto);
}

/** Estado derivado. Nunca se guarda: se calcula con la fecha simulada `hoy`. */
export function estadoObligacion(ob: Obligacion, pagadoMonto: Centimos, hoy: ISODate): EstadoObligacion {
  if (ob.anulada) return 'ANULADA';
  if (saldo(ob, pagadoMonto) === 0) return 'PAGADA';
  if (ob.fechaVencimiento < hoy) return 'VENCIDA';
  if (pagadoMonto > 0) return 'PARCIAL';
  if (ob.fechaVencimiento > sumarDias(hoy, 30)) return 'PROGRAMADA';
  return 'PENDIENTE';
}
