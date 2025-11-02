export interface CreateSolicitudTarjetaDto {
  id_centro_de_salud?: number;
  id_ciudadano?: number;
  tipo_tarjeta?: number;
  observaciones?: string;
  examen_medico?: string;
}

export interface SolicitudTarjetaResponse {
  id: number;
  mensaje: string;
  solicitud: CreateSolicitudTarjetaDto;
}

export interface SolicitudPendiente {
  id_solicitud: number;
  id_medico?: number | null;
  fecha_solicitud: string;
  id_centro_de_salud: number;
  area?: string | null;
  id_ciudadano: number;
  tipo_tarjeta: number;
  estado: number; // 1 = pendiente, 2 = aprobado, 3 = rechazado
  observaciones?: string;
  fecha_capacitacion?: string | null;
  examen_medico?: string;
}

export interface CentroDeSalud {
  id: number;
  nombre: string;
}

export interface UpdateSolicitudTarjetaDto {
  id_solicitud?: number;
  id_medico?: number;
  fecha_solicitud?: string | Date;
  id_centro_de_salud?: number;
  area?: string | null;
  id_ciudadano?: number;
  tipo_tarjeta?: number;
  estado?: number;
  observaciones?: string;
  fecha_capacitacion?: string | Date | null;
  examen_medico?: string;
}

