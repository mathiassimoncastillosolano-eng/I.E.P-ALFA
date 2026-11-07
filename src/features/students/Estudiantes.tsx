import { useState } from 'react';
import { toast } from 'sonner';
import { api, mensaje, type NuevoEstudiante } from '@/services';
import { useServicio } from '@/hooks/useServicio';
import { useApp } from '@/stores/app';
import { Badge, Btn, Card, Cargando, Tabla, Vacio, inputCls, td } from '@/components/ui';

const VACIO: NuevoEstudiante = {
  dni: '', nombres: '', apellidoPaterno: '', apellidoMaterno: '', fechaNacimiento: '', sexo: 'M', direccion: '',
  apoDni: '', apoNombres: '', apoApellidos: '', apoParentesco: 'Madre', apoTelefono: '',
};
const CAMPOS: { k: keyof NuevoEstudiante; etiqueta: string; tipo?: string }[] = [
  { k: 'dni', etiqueta: 'DNI (8 dígitos)' }, { k: 'nombres', etiqueta: 'Nombres' }, { k: 'apellidoPaterno', etiqueta: 'Apellido paterno' },
  { k: 'apellidoMaterno', etiqueta: 'Apellido materno' }, { k: 'fechaNacimiento', etiqueta: 'Fecha de nacimiento', tipo: 'date' }, { k: 'direccion', etiqueta: 'Dirección' },
  { k: 'apoDni', etiqueta: 'DNI apoderado' }, { k: 'apoNombres', etiqueta: 'Nombres apoderado' }, { k: 'apoApellidos', etiqueta: 'Apellidos apoderado' },
  { k: 'apoParentesco', etiqueta: 'Parentesco' }, { k: 'apoTelefono', etiqueta: 'Teléfono apoderado (9 dígitos)' },
];
const POR_PAGINA = 12;

export default function Estudiantes() {
  const bump = useApp((s) => s.bump);
  const filas = useServicio(() => api.listarEstudiantes());
  const [q, setQ] = useState('');
  const [grado, setGrado] = useState('');
  const [pagina, setPagina] = useState(0);
  const [abrir, setAbrir] = useState(false);
  const [f, setF] = useState<NuevoEstudiante>(VACIO);
  if (!filas) return <Cargando />;

  const grados = Array.from(new Set(filas.map((x) => x.grado))).sort();
  const t = q.trim().toLowerCase();
  const visibles = filas.filter((x) => (!grado || x.grado === grado) &&
    (!t || x.dni.includes(t) || `${x.nombres} ${x.apellidoPaterno} ${x.apellidoMaterno}`.toLowerCase().includes(t)));
  const paginas = Math.max(1, Math.ceil(visibles.length / POR_PAGINA));
  const actual = Math.min(pagina, paginas - 1);

  const guardar = () => {
    api.crearEstudiante(f).then((e) => {
      toast.success(`Estudiante ${e.codigo} registrado`);
      setF(VACIO); setAbrir(false); bump();
    }).catch((err: unknown) => toast.error(mensaje(err)));
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Estudiantes</h1>
        <Btn onClick={() => setAbrir(!abrir)}>{abrir ? 'Cerrar' : 'Registrar estudiante'}</Btn>
      </div>
      {abrir && (
        <Card titulo="Nuevo estudiante y apoderado">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {CAMPOS.map((c) => (
              <label key={c.k} className="text-xs text-muted">{c.etiqueta}
                <input className={inputCls} type={c.tipo ?? 'text'} value={f[c.k]} onChange={(e) => setF({ ...f, [c.k]: e.target.value })} />
              </label>
            ))}
            <label className="text-xs text-muted">Sexo
              <select className={inputCls} value={f.sexo} onChange={(e) => setF({ ...f, sexo: e.target.value as 'M' | 'F' })}>
                <option value="M">Masculino</option><option value="F">Femenino</option>
              </select>
            </label>
          </div>
          <div className="mt-4 flex gap-2"><Btn onClick={guardar}>Guardar</Btn><Btn variante="suave" onClick={() => setF(VACIO)}>Limpiar</Btn></div>
        </Card>
      )}
      <Card>
        <div className="mb-3 flex flex-wrap gap-3">
          <input className={`${inputCls} max-w-xs`} placeholder="Buscar por DNI o nombre" value={q} onChange={(e) => { setQ(e.target.value); setPagina(0); }} />
          <select className={`${inputCls} max-w-xs`} value={grado} onChange={(e) => { setGrado(e.target.value); setPagina(0); }}>
            <option value="">Todos los grados</option>
            {grados.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        {visibles.length === 0 ? <Vacio texto="No hay estudiantes con esos filtros" /> : (
          <Tabla cabeceras={['Código', 'DNI', 'Estudiante', 'Grado', 'Sec.', 'Apoderado', 'Teléfono', 'Estado', 'Matrícula']}>
            {visibles.slice(actual * POR_PAGINA, (actual + 1) * POR_PAGINA).map((x) => (
              <tr key={x.id} className="border-b border-line/60 hover:bg-app">
                <td className={td}>{x.codigo}</td><td className={td}>{x.dni}</td>
                <td className={td}>{x.apellidoPaterno} {x.apellidoMaterno}, {x.nombres}</td>
                <td className={td}>{x.grado}</td><td className={td}>{x.seccion}</td><td className={td}>{x.apoderado}</td><td className={td}>{x.telefonoApoderado}</td>
                <td className={td}><Badge valor={x.estado} /></td><td className={td}><Badge valor={x.estadoMatricula} /></td>
              </tr>
            ))}
          </Tabla>
        )}
        <div className="mt-3 flex items-center justify-between text-sm text-muted">
          <span>{visibles.length} estudiantes</span>
          <span className="flex items-center gap-2">
            <Btn variante="suave" disabled={actual === 0} onClick={() => setPagina(actual - 1)}>Anterior</Btn>
            {actual + 1} / {paginas}
            <Btn variante="suave" disabled={actual >= paginas - 1} onClick={() => setPagina(actual + 1)}>Siguiente</Btn>
          </span>
        </div>
      </Card>
    </>
  );
}
