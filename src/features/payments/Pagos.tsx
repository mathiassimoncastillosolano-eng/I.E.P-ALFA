import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { api, mensaje, type ObligacionVista } from '@/services';
import { METODOS } from '@/constants/metodos';
import { useServicio } from '@/hooks/useServicio';
import { useApp } from '@/stores/app';
import type { MetodoPago } from '@/types';
import { Badge, Btn, Card, Cargando, Stat, Tabla, Vacio, inputCls, td } from '@/components/ui';
import { fechaCorta, soles } from '@/utils/formato';

interface FormPago { obId: string; importe: string; metodo: MetodoPago; op: string }

export default function Pagos() {
  const bump = useApp((s) => s.bump);
  const [params, setParams] = useSearchParams();
  const estId = params.get('e') ?? '';
  const ests = useServicio(() => api.listarEstudiantes());
  const obs = useServicio(() => (estId ? api.obligacionesDe(estId) : Promise.resolve<ObligacionVista[]>([])), [estId]);
  const pagos = useServicio(() => api.listarPagos(estId || undefined), [estId]);
  const [pag, setPag] = useState<FormPago | null>(null);
  if (!ests || !obs || !pagos) return <Cargando />;

  const vivas = obs.filter((o) => o.estado !== 'ANULADA');
  const obligado = vivas.reduce((s, o) => s + o.importeOriginal, 0);
  const pagadoTotal = vivas.reduce((s, o) => s + o.pagado, 0);
  const vencido = vivas.filter((o) => o.estado === 'VENCIDA').reduce((s, o) => s + o.saldo, 0);

  const guardar = () => {
    if (!pag) return;
    api.registrarPago({ obligacionId: pag.obId, importe: Math.round(parseFloat(pag.importe) * 100), metodo: pag.metodo, numeroOperacion: pag.op })
      .then((p) => { toast.success(`Pago ${p.numeroComprobante} registrado`); setPag(null); bump(); })
      .catch((e: unknown) => toast.error(mensaje(e)));
  };
  const revertir = (id: string) => {
    const motivo = window.prompt('Motivo de la reversión:');
    if (!motivo) return;
    api.revertirPago(id, motivo).then(() => { toast.success('Pago revertido'); bump(); }).catch((e: unknown) => toast.error(mensaje(e)));
  };

  return (
    <>
      <h1 className="text-xl font-semibold">Pagos y estado de cuenta</h1>
      <Card>
        <label className="text-xs text-muted">Estudiante
          <select className={`${inputCls} max-w-xl`} value={estId} onChange={(e) => { setPag(null); setParams(e.target.value ? { e: e.target.value } : {}); }}>
            <option value="">Seleccionar estudiante…</option>
            {ests.map((e) => <option key={e.id} value={e.id}>{e.dni} · {e.apellidoPaterno} {e.apellidoMaterno}, {e.nombres} ({e.grado})</option>)}
          </select>
        </label>
      </Card>
      {estId && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat etiqueta="Total obligaciones" valor={soles(obligado)} />
            <Stat etiqueta="Total pagado" valor={soles(pagadoTotal)} />
            <Stat etiqueta="Saldo pendiente" valor={soles(obligado - pagadoTotal)} />
            <Stat etiqueta="Vencido" valor={soles(vencido)} alerta />
          </div>
          <Card titulo="Obligaciones">
            {obs.length === 0 ? <Vacio texto="Este estudiante no tiene obligaciones" /> : (
              <Tabla cabeceras={['Concepto', 'Periodo', 'Vence', 'Importe', 'Pagado', 'Saldo', 'Estado', '']}>
                {obs.map((o) => (
                  <tr key={o.id} className="border-b border-line/60 hover:bg-app">
                    <td className={td}>{o.concepto === 'MATRICULA' ? 'Matrícula' : 'Mensualidad'} {o.anio}</td><td className={td}>{o.periodo}</td>
                    <td className={td}>{fechaCorta(o.fechaVencimiento)}</td><td className={td}>{soles(o.importeOriginal)}</td>
                    <td className={td}>{soles(o.pagado)}</td><td className={td}>{soles(o.saldo)}</td><td className={td}><Badge valor={o.estado} /></td>
                    <td className={td}>
                      {o.saldo > 0 && o.estado !== 'ANULADA' && (
                        <Btn onClick={() => setPag({ obId: o.id, importe: (o.saldo / 100).toFixed(2), metodo: 'EFECTIVO', op: '' })}>Pagar</Btn>
                      )}
                    </td>
                  </tr>
                ))}
              </Tabla>
            )}
          </Card>
          {pag && (
            <Card titulo="Registrar pago">
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="text-xs text-muted">Importe (S/) — admite pago parcial
                  <input className={inputCls} value={pag.importe} onChange={(e) => setPag({ ...pag, importe: e.target.value })} />
                </label>
                <label className="text-xs text-muted">Método
                  <select className={inputCls} value={pag.metodo} onChange={(e) => setPag({ ...pag, metodo: e.target.value as MetodoPago })}>
                    {METODOS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </label>
                <label className="text-xs text-muted">N.º de operación
                  <input className={inputCls} value={pag.op} onChange={(e) => setPag({ ...pag, op: e.target.value })} />
                </label>
              </div>
              <div className="mt-4 flex gap-2"><Btn onClick={guardar}>Confirmar pago</Btn><Btn variante="suave" onClick={() => setPag(null)}>Cancelar</Btn></div>
            </Card>
          )}
        </>
      )}
      <Card titulo={estId ? 'Historial de pagos del estudiante' : 'Pagos recientes (todos)'}>
        {pagos.length === 0 ? <Vacio texto="Sin pagos registrados" /> : (
          <Tabla cabeceras={['Comprobante', 'Estudiante', 'Concepto', 'Fecha', 'Método', 'Importe', 'Estado', '']}>
            {pagos.slice(0, 30).map((p) => (
              <tr key={p.id} className="border-b border-line/60 hover:bg-app">
                <td className={td}>{p.numeroComprobante}</td><td className={td}>{p.estudiante}</td><td className={td}>{p.conceptos}</td>
                <td className={td}>{fechaCorta(p.fechaPago)}</td><td className={td}>{p.metodo}</td><td className={td}>{soles(p.total)}</td>
                <td className={td}><Badge valor={p.estado} /></td>
                <td className={td}>{p.estado === 'CONFIRMADO' && <Btn variante="peligro" onClick={() => revertir(p.id)}>Revertir</Btn>}</td>
              </tr>
            ))}
          </Tabla>
        )}
      </Card>
    </>
  );
}
