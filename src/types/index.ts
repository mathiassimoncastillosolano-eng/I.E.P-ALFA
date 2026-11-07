export type ID = string;
export type ISODate = string; // 'YYYY-MM-DD'
export type ISODateTime = string;
export type Centimos = number; // S/ 150.00 = 15000

export type NivelId = 'PRIMARIA' | 'SECUNDARIA';

export interface ConfigEconomica {
  importeMatricula: Centimos;
  importeMensualidad: Centimos;
  numeroCuotas: number;
  mesInicio: number; // 3 = marzo
  diaVencimiento: number; // 1..28
}

export interface AnioAcademico {
  id: ID;
  nombre: string;
  fechaInicio: ISODate;
  fechaFin: ISODate;
  estado: 'PLANIFICADO' | 'ACTIVO' | 'CERRADO';
  configEconomica: ConfigEconomica;
}

export interface Grado {
  id: ID;
  nivel: NivelId;
  orden: number;
  nombre: string;
}

export interface Seccion {
  id: ID;
  anioId: ID;
  gradoId: ID;
  nombre: string;
  capacidad: number;
  estado: 'ABIERTA' | 'CERRADA';
}

export interface Apoderado {
  id: ID;
  dni: string;
  nombres: string;
  apellidos: string;
  parentesco: string;
  telefono: string;
  email?: string;
  direccion?: string;
}

export interface Estudiante {
  id: ID;
  codigo: string;
  dni: string;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  fechaNacimiento: ISODate;
  sexo: 'M' | 'F';
  direccion: string;
  telefono?: string;
  email?: string;
  fotoUrl?: string;
  apoderadoPrincipalId: ID;
  apoderadosIds: ID[];
  observaciones?: string;
  estado: 'ACTIVO' | 'INACTIVO' | 'RETIRADO';
}

export type EstadoMatricula = 'PENDIENTE' | 'MATRICULADO' | 'RETIRADO' | 'ANULADO' | 'FINALIZADO';

export interface CondicionEconomica {
  descuentoMatriculaPct: number;
  descuentoMensualidadPct: number;
  exoneradoMatricula: boolean;
  notas?: string;
}

export interface Matricula {
  id: ID;
  estudianteId: ID;
  anioId: ID;
  seccionId: ID;
  estado: EstadoMatricula;
  fechaMatricula: ISODate;
  condicionEconomica: CondicionEconomica;
  motivoCambioEstado?: string;
  fechaCambioEstado?: ISODate;
}

export type ConceptoEconomico = 'MATRICULA' | 'MENSUALIDAD';

export interface Obligacion {
  id: ID;
  matriculaId: ID;
  concepto: ConceptoEconomico;
  periodo: string;
  importeOriginal: Centimos;
  fechaVencimiento: ISODate;
  anulada: boolean;
}

export type MetodoPago = 'EFECTIVO' | 'TRANSFERENCIA' | 'YAPE' | 'PLIN' | 'OTRO';

export interface Pago {
  id: ID;
  numeroComprobante: string;
  estudianteId: ID;
  fechaPago: ISODate;
  metodo: MetodoPago;
  numeroOperacion?: string;
  observaciones?: string;
  total: Centimos;
  estado: 'CONFIRMADO' | 'REVERTIDO';
  motivoReversion?: string;
  fechaReversion?: ISODate;
}

export interface DetallePago {
  id: ID;
  pagoId: ID;
  obligacionId: ID;
  importe: Centimos;
}

export type RolId = 'ADMINISTRADOR' | 'DIRECCION' | 'SECRETARIA' | 'TESORERIA';

export interface Usuario {
  id: ID;
  nombre: string;
  email: string;
  rol: RolId;
  activo: boolean;
}

export interface EventoAuditoria {
  id: ID;
  usuarioId: ID;
  fechaHora: ISODateTime;
  accion: 'CREAR' | 'EDITAR' | 'MATRICULAR' | 'RETIRAR' | 'ANULAR' | 'PAGAR' | 'REVERTIR_PAGO' | 'CONFIG_ECONOMICA';
  modulo: string;
  entidad: string;
  entidadId: ID;
  descripcion: string;
}

export type EstadoObligacion = 'ANULADA' | 'PAGADA' | 'PARCIAL' | 'VENCIDA' | 'PROGRAMADA' | 'PENDIENTE';
