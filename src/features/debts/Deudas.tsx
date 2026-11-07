import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/services';
import { useServicio } from '@/hooks/useServicio';
import { Badge, Card, Cargando, Stat, Tabla, Vacio, inputCls, td } from '@/components/ui';
import { fechaCorta, soles } from '@/utils/formato';

export default function Deudas() {
  const filas = useServicio(() => api.deudas());
  const [q, setQ] = useState('');
  const [estado, setEstado] = useState('');
  if (!filas) return <Cargando />;

  const t = q.trim().toLowerCase();
  const visibles = filas.filter((d) => (!estado || d.estado === estado) && (!t || d.dni.includes(t) || d.estudiante.toLowerCase().includes(t)));
  const total = visibles.reduce((s, d) => s + d.saldo, 0);
  const vencidas = filas.filter((d) => d.estado === 'VENCIDA');

  return (
    <>
      <h1 className="text-xl font-semibold">Deudas y pendientes</h1>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat etiqueta="Saldo listado" valor={soles(total)} />
        <Stat etiqueta="Cuotas vencidas" valor={vencidas.length} alerta />
        <Stat etiqueta="Estudiantes morosos" valor={new Set(vencidas.map((d) => d.estudianteId)).size} alerta />
        <Stat etiqueta="Pagos parciales" valor={filas.filter((d) => d.estado === 'PARCIAL').length} />
      </div>
      <Card>
        <div className="mb-3 flex flex-wrap gap-3">
          <input className={`${inputCls} max-w-xs`} placeholder="Buscar por DNI o nombre" value={q} onChange={(e) => setQ(e.target.value)} />
          <select className={`${inputCls} max-w-xs`} value={estado} onChange={(e) => setEstado(e.target.value)}>
            <option value="">Todos los estados</option>
            <option value="VENCIDA">Vencidas</option><option value="PARCIAL">Pago parcial</option><option value="PENDIENTE">Por vencer</option>
          </select>
        </div>
        {visibles.length === 0 ? <Vacio texto="No hay deudas con esos filtros" /> : (
          <Tabla cabeceras={['Estudiante', 'DNI', 'Grado', 'Concepto', 'Periodo', 'Vence', 'Saldo', 'Estado', '']}>
            {visibles.slice(0, 60).map((d) => (
              <tr key={d.id} className="border-b border-line/60 hover:bg-app">
                <td className={td}>{d.estudiante}</td><td className={td}>{d.dni}</td><td className={td}>{d.grado} {d.seccion}</td>
                <td className={td}>{d.concepto === 'MATRICULA' ? 'Matrícula' : 'Mensualidad'}</td><td className={td}>{d.periodo}</td>
                <td className={td}>{fechaCorta(d.fechaVencimiento)}</td><td className={td}>{soles(d.saldo)}</td><td className={td}><Badge valor={d.estado} /></td>
                <td className={td}><Link className="text-brand-500 hover:underline" to={`/pagos?e=${d.estudianteId}`}>Estado de cuenta</Link></td>
              </tr>
            ))}
          </Tabla>
        )}
        {visibles.length > 60 && <p className="mt-2 text-xs text-muted">Mostrando 60 de {visibles.length}. Usa los filtros para acotar.</p>}
      </Card>
    </>
  );
}
