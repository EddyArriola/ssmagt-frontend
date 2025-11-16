// Interfaz para la solicitud de tarjeta anidada
export interface SolicitudTarjeta {
  id_centro_de_salud: number;
  id_ciudadano: number;
  fecha_solicitud: string;
  tipo_tarjeta: number;
  estado: number;
  // Información adicional que puede venir del backend
  cui_ciudadano?: string;
  nombres?: string;
  apellidos?: string;
  observaciones?: string;
  fecha_capacitacion?: string | null;
  examen_medico?: string;
  usuario?: {
    nombres: string;
    apellidos: string;
    cui: string;
    email: string;
    telefono: string;
  };
  institucion?: {
    id: number;
    nombre: string;
  };
}

// Interfaz para tarjeta aprobada
export interface Tarjeta {
  id_tarjeta: number;
  id_solicitud?: number;
  fecha_emision: string;
  fecha_vencimiento: string;
  estado: number;
  solicitud_tarjeta: SolicitudTarjeta;
}

// Interfaz para respuesta del endpoint de tarjetas por centro
export interface TarjetasCentroResponse {
  tarjetas: Tarjeta[];
  total: number;
}

// Enums para estados y tipos
export enum EstadoTarjeta {
  PENDIENTE = 1,
  APROBADA = 2,
  VENCIDA = 3,
  CANCELADA = 4
}

export enum TipoTarjeta {
  SALUD = 1,
  MANIPULACION = 2
}