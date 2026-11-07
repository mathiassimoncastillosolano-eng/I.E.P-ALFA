import { describe, expect, it } from 'vitest';
import type { DetallePago, Obligacion, Pago } from '@/types';
import { estadoObligacion, pagado, saldo } from './finanzas';

const ob = (over: Partial<Obligacion> = {}): Obligacion => ({
  id: 'ob1', matriculaId: 'm1', concepto: 'MENSUALIDAD', periodo: '2026-04',
  importeOriginal: 10000, fechaVencimiento: '2026-04-10', anulada: false, ...over,
});
const pago = (id: string, estado: Pago['estado']): Pago => ({
  id, numeroComprobante: id, estudianteId: 'e1', fechaPago: '2026-04-01', metodo: 'EFECTIVO',
  total: 0, estado,
});
const det = (pagoId: string, importe: number): DetallePago => ({ id: `d-${pagoId}`, pagoId, obligacionId: 'ob1', importe });

describe('estadoObligacion', () => {
  it('anulada tiene prioridad', () => {
    expect(estadoObligacion(ob({ anulada: true }), 0, '2026-04-01')).toBe('ANULADA');
  });
  it('pagada cuando saldo es 0', () => {
    expect(estadoObligacion(ob(), 10000, '2026-05-01')).toBe('PAGADA');
  });
  it('vencida con pago parcial sigue vencida', () => {
    expect(estadoObligacion(ob(), 4000, '2026-04-11')).toBe('VENCIDA');
  });
  it('parcial antes del vencimiento', () => {
    expect(estadoObligacion(ob(), 4000, '2026-04-05')).toBe('PARCIAL');
  });
  it('el día del vencimiento aún no está vencida', () => {
    expect(estadoObligacion(ob(), 0, '2026-04-10')).toBe('PENDIENTE');
  });
  it('programada si vence a más de 30 días', () => {
    expect(estadoObligacion(ob(), 0, '2026-03-01')).toBe('PROGRAMADA');
  });
});

describe('pagado / saldo', () => {
  it('ignora pagos revertidos', () => {
    const pagos = [pago('p1', 'CONFIRMADO'), pago('p2', 'REVERTIDO')];
    const detalles = [det('p1', 3000), det('p2', 5000)];
    const p = pagado(ob(), detalles, pagos);
    expect(p).toBe(3000);
    expect(saldo(ob(), p)).toBe(7000);
  });
  it('el saldo nunca es negativo', () => {
    expect(saldo(ob(), 99999)).toBe(0);
  });
});
