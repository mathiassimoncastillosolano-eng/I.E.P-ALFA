import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '@/services';
import { useServicio } from '@/hooks/useServicio';
import { Badge, Card, Cargando, Stat, Tabla, td } from '@/components/ui';
import { fechaCorta, soles } from '@/utils/formato';

export default function Dashboard() {
  const r = useServicio(() => api.dashboard());
  if (!r) return <Cargando />;
  return (
    <>
      <h1 className="text-xl font-semibold">Dashboard</h1>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat etiqueta="Estudiantes" valor={r.totalEstudiantes} />
        <Stat etiqueta="Matriculados (año activo)" valor={r.matriculados} />
        <Stat etiqueta="Ingresos totales" valor={soles(r.ingresos)} />
        <Stat etiqueta="Recaudación del mes" valor={soles(r.recaudacionMes)} />
        <Stat etiqueta="Pendiente de cobro" valor={soles(r.pendiente)} />
        <Stat etiqueta="Monto vencido" valor={soles(r.vencido)} alerta />
        <Stat etiqueta="Estudiantes con deuda vencida" valor={r.deudores} alerta />
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card titulo="Ingresos por mes (S/)">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={r.ingresosMes}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="mes" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="total" name="Ingresos" fill="var(--color-brand-700)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card titulo="Obligaciones por estado">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={r.estados}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="estado" fontSize={11} />
                <YAxis fontSize={12} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="cantidad" name="Cantidad" fill="var(--color-brand-500)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
      <Card titulo="Últimos pagos registrados">
        <Tabla cabeceras={['Comprobante', 'Estudiante', 'Concepto', 'Fecha', 'Importe']}>
          {r.ultimosPagos.map((p) => (
            <tr key={p.id} className="border-b border-line/60">
              <td className={td}>{p.numeroComprobante}</td><td className={td}>{p.estudiante}</td><td className={td}>{p.conceptos}</td>
              <td className={td}>{fechaCorta(p.fechaPago)}</td><td className={td}><Badge valor="CONFIRMADO" /> {soles(p.total)}</td>
            </tr>
          ))}
        </Tabla>
      </Card>
    </>
  );
}
