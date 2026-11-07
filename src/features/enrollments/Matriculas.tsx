import { useState } from 'react';
import { toast } from 'sonner';
import { api, mensaje } from '@/services';
import { useServicio } from '@/hooks/useServicio';
import { useApp } from '@/stores/app';
import { Badge, Btn, Card, Cargando, Tabla, Vacio, inputCls, td } from '@/components/ui';
import { fechaCorta } from '@/utils/formato';

const ESTADOS = ['MATRICULADO', 'RETIRADO', 'ANULADO', 'PENDIENTE', 'FINALIZADO'];

export default function Matriculas() {
  const bump = useApp((s) => s.bump);
  const filas = useServicio(() => api.listarMatriculas());
  const ests = useServicio(() => api.listarEstudiantes());
  const anios = useServicio(() => api.listarAnios());
  const [form, setForm] = useState({ estudianteId: '', anioId: 'a-2026', seccionId: '', descuento: '0' });
  const secciones = useServicio(() => api.secciones(form.anioId), [form.anioId]);
  const [estado, setEstado] = useState('');
  const [q, setQ] = useState('');
  if (!filas || !ests || !anios) return <Cargando />;

  const matricular = () => {
    api.matricular({ estudianteId: form.estudianteId, seccionId: form.seccionId, descuentoMensualidadPct: Number(form.descuento) })
      .then(() => { toast.success('Matrícula registrada y obligaciones generadas'); setForm({ ...form, estudianteId: '', seccionId: '' }); bump(); })
      .catch((e: unknown) => toast.error(mensaje(e)));
  };
  const cambiar = (id: string, destino: 'RETIRADO' | 'ANULADO') => {
    const motivo = window.prompt(`Motivo (${destino === 'RETIRADO' ? 'retiro' : 'anulación'}):`);
    if (!motivo) return;
    api.cambiarEstado(id, destino, motivo).then(() => { toast.success('Estado actualizado'); bump(); }).catch((e: unknown) => toast.error(mensaje(e)));
  };
  const t = q.trim().toLowerCase();
  const visibles = filas.filter((m) => (!estado || m.estado === estado) && (!t || m.dni.includes(t) || m.estudiante.toLowerCase().includes(t)));

  return (
    <>
      <h1 className="text-xl font-semibold">Matrículas</h1>
      <Card titulo="Nueva matrícula">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-xs text-muted">Estudiante
            <select className={inputCls} value={form.estudianteId} onChange={(e) => setForm({ ...form, estudianteId: e.target.value })}>
              <option value="">Seleccionar…</option>
              {ests.map((e) => <option key={e.id} value={e.id}>{e.dni} · {e.apellidoPaterno} {e.apellidoMaterno}, {e.nombres}</option>)}
            </select>
          </label>
          <label className="text-xs text-muted">Año académico
            <select className={inputCls} value={form.anioId} onChange={(e) => setForm({ ...form, anioId: e.target.value, seccionId: '' })}>
              {anios.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
            </select>
          </label>
          <label className="text-xs text-muted">Grado y sección
            <select className={inputCls} value={form.seccionId} onChange={(e) => setForm({ ...form, seccionId: e.target.value })}>
              <option value="">Seleccionar…</option>
              {(secciones ?? []).map((s) => <option key={s.id} value={s.id} disabled={s.vacantes <= 0}>{s.etiqueta} ({s.vacantes} vacantes)</option>)}
            </select>
          </label>
          <label className="text-xs text-muted">Descuento en mensualidad (%)
            <input className={inputCls} type="number" min={0} max={100} value={form.descuento} onChange={(e) => setForm({ ...form, descuento: e.target.value })} />
          </label>
        </div>
        <div className="mt-4"><Btn onClick={matricular}>Confirmar matrícula</Btn></div>
      </Card>
      <Card>
        <div className="mb-3 flex flex-wrap gap-3">
          <input className={`${inputCls} max-w-xs`} placeholder="Buscar por DNI o nombre" value={q} onChange={(e) => setQ(e.target.value)} />
          <select className={`${inputCls} max-w-xs`} value={estado} onChange={(e) => setEstado(e.target.value)}>
            <option value="">Todos los estados</option>
            {ESTADOS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        {visibles.length === 0 ? <Vacio texto="Sin matrículas para mostrar" /> : (
          <Tabla cabeceras={['Estudiante', 'DNI', 'Año', 'Grado', 'Sec.', 'Fecha', 'Estado', 'Acciones']}>
            {visibles.slice(0, 40).map((m) => (
              <tr key={m.id} className="border-b border-line/60 hover:bg-app">
                <td className={td}>{m.estudiante}</td><td className={td}>{m.dni}</td><td className={td}>{m.anio}</td><td className={td}>{m.grado}</td>
                <td className={td}>{m.seccion}</td><td className={td}>{fechaCorta(m.fecha)}</td>
                <td className={td}><Badge valor={m.estado} />{m.motivo ? <span className="ml-2 text-xs text-muted">{m.motivo}</span> : null}</td>
                <td className={`${td} space-x-2 whitespace-nowrap`}>
                  {m.estado === 'MATRICULADO' && <Btn variante="peligro" onClick={() => cambiar(m.id, 'RETIRADO')}>Retirar</Btn>}
                  {(m.estado === 'MATRICULADO' || m.estado === 'PENDIENTE') && <Btn variante="suave" onClick={() => cambiar(m.id, 'ANULADO')}>Anular</Btn>}
                </td>
              </tr>
            ))}
          </Tabla>
        )}
        {visibles.length > 40 && <p className="mt-2 text-xs text-muted">Mostrando 40 de {visibles.length}. Usa los filtros para acotar.</p>}
      </Card>
    </>
  );
}
