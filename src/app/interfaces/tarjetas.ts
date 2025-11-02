export interface tarjeta {
    id_tarjeta?: number;
    id_solicitud?: number;
    fecha_emision: Date | string;
    fecha_vencimiento?: Date | string;
    estado?: number;
    nombre?: any;
    
    // Nueva estructura del endpoint con información completa
    solicitud_tarjeta?: {
        id_centro_de_salud: number;
        id_ciudadano: number;
        fecha_solicitud: string;
        tipo_tarjeta: number; // 1 = salud, 2 = alimentos
        estado: number;
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
    };
    
    // Información de la solicitud asociada (compatibilidad hacia atrás)
    solicitud?: {
        id_solicitud: number;
        id_ciudadano: number;
        id_centro_de_salud: number;
        tipo_tarjeta: number; // 1 = salud, 2 = alimentos
        fecha_solicitud: string;
        estado: number;
        observaciones?: string;
        examen_medico?: string;
        id_medico?: number;
    };
    
    // Información del ciudadano
    ciudadano?: {
        id_usuario: number;
        nombres: string;
        apellidos: string;
        cui?: string;
        email?: string;
        telefono?: string;
        direccion?: string;
        ocupacion?: string;
    };
    
    // Información del centro de salud
    centro_salud?: {
        id: number;
        nombre: string;
    };
    
    // Campos adicionales para compatibilidad
    id_ciudadano?: number;
    tipo_tarjeta?: number;
    centro_nombre?: string;
    ciudadano_nombre?: string;
    ciudadano_apellido?: string;
}