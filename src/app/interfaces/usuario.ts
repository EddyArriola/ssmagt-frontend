// Interfaz para crear un nuevo usuario
export interface CreateUsuarioDto {
  nombres: string;
  apellidos: string;
  cui: string;
  fecha_nacimiento: Date | string;
  direccion?: string;
  telefono?: string;
  email?: string;
  ocupacion?: string;
  password: string;
  // No incluir id_instituto ni id_rol aquí - el backend los maneja internamente
}

// Interfaz para usuario existente (respuesta del servidor)
export interface Usuario {
  id_usuario?: number;
  id_rol?: number;
  nombres: string;
  apellidos: string;
  cui: string;
  fecha_nacimiento: Date;
  direccion?: string;
  telefono?: string;
  email?: string;
  ocupacion?: string;
  password: string;
  instituto?: number;
  fecha_creacion?: Date;
  estado?: number; // 1 = activo, 0 = inactivo
  rol?: any; // Objeto de relación con la tabla rol
  Instituto?: any; // Objeto de relación con la tabla Instituto
}

// Interfaz para actualizar usuario (sin password obligatorio)
export interface UpdateUsuarioDto {
  nombres?: string;
  apellidos?: string;
  cui?: string;
  fecha_nacimiento?: Date;
  direccion?: string;
  telefono?: string;
  email?: string;
  ocupacion?: string;
  password?: string;
  estado?: number;
  // Los roles e institutos se manejan por separado en el backend
}

// Interfaz para login
export interface LoginDto {
  email: string;
  password: string;
}

// Interfaz para respuesta de login
export interface LoginResponse {
  access_token: string;
  usuario: Usuario;
  message: string;
}

// Interfaz para validación de formulario
export interface UsuarioFormErrors {
  nombres?: string;
  apellidos?: string;
  cui?: string;
  fecha_nacimiento?: string;
  email?: string;
  telefono?: string;
  password?: string;
  confirmPassword?: string;
}