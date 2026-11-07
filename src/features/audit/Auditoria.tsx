import { api } from '@/services';
import { useServicio } from '@/hooks/useServicio';
import { Card, Cargando, Tabla, Vacio, td } from '@/components/ui';

export default function Auditoria() {
  const eventos = useServicio(() => api.auditoria());
  if (!eventos) return <Cargando />;
  return (
    <>
      <h1 className="text-xl font-semibold">Auditoría</h1>
      <Card titulo="Últimos 200 eventos (solo lectura)">
        {eventos.length === 0 ? <Vacio texto="Sin eventos" /> : (
          <Tabla cabeceras={['Fecha', 'Hora', 'Usuario', 'Acción', 'Módulo', 'Entidad', 'Descripción']}>
            {eventos.map((e) => (
              <tr key={e.id} className="border-b border-line/60">
                <td className={td}>{e.fechaHora.slice(0, 10)}</td><td className={td}>{e.fechaHora.slice(11, 16)}</td><td className={td}>Administrador (demo)</td>
                <td className={td}>{e.accion}</td><td className={td}>{e.modulo}</td><td className={td}>{e.entidad}</td><td className={td}>{e.descripcion}</td>
              </tr>
            ))}
          </Tabla>
        )}
      </Card>
    </>
  );
}
