import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Usuario } from '../../../interfaces/usuario';
import { Instituto } from '../../../interfaces/instituto';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-listado-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './listado-usuarios.component.html',
  styleUrl: './listado-usuarios.component.css'
})
export class ListadoUsuariosComponent implements OnInit {
  usuarios: Usuario[] = [];
  institutos: Instituto[] = [
    {
      id_centro: 1,
      nombre: "Centro de Salud Amatitlán",
      id_area: 1,
      direccion: "F9JF+VW9, Amatitlán",
      telefono: "6633 0267",
      email: "csamatitlan@gmail.com"
    },
    {
      id_centro: 2,
      nombre: "Centro de salud Villa Nueva",
      id_area: 1,
      direccion: "5a calle, Villa Nueva, Guatemala",
      telefono: "6636 8977",
      email: "centrodesaludvillanueva@gmail.com"
    },
    {
      id_centro: 3,
      nombre: "Centro de salud Peronia",
      id_area: 1,
      direccion: "11 Calle 2-51 Z-8 Mixco Ciudad Peronia",
      telefono: "6666-6666",
      email: "centrodesaludperonia@gmail.com"
    },
    {
      id_centro: 4,
      nombre: "Centro de salud Mezquital",
      id_area: 1,
      direccion: "I,, Puente Villa Lobos, Villa Nueva, Guatemala",
      telefono: "5488 3618",
      email: "centrodesaludmezquital@gmail.com"
    },
    {
      id_centro: 5,
      nombre: "Centro de salud Ciudad Real",
      id_area: 1,
      direccion: "6a Calle, Ciudad Real, Zona 12, Guatemala, Guatemala",
      telefono: "2479 2831",
      email: "centrodesaludciuadreal@gmail.com"
    },
    {
      id_centro: 6,
      nombre: "Centro de salud San Miguel Petapa",
      id_area: 1,
      direccion: "San Miguel Petapa, Guatemala",
      telefono: "66315801",
      email: "twitter.com/PetapaCdsalud"
    },
    {
      id_centro: 7,
      nombre: "Centro de salud Villa Canales",
      id_area: 1,
      direccion: "2da av. 2-62 zona 1 Villa Canales",
      telefono: "6635 0837",
      email: "centrodesaludvillacanales1@gmail.com"
    }
  ];
  loading = false;
  error: string | null = null;
  
  // Filtros
  filtroNombre = '';
  filtroRol: number | null = null;
  filtroEstado: number | null = null;

  // Modal de edición
  mostrarModalEdicion = false;
  usuarioEditando: Usuario | null = null;
  loadingInstitutos = false;
  loadingEdicion = false;
  errorEdicion: string | null = null;

  // Datos de edición
  nuevoRol: number | null = null;
  nuevoInstituto: number | null = null;

  // Control de eliminación
  usuariosEliminando: Set<number> = new Set();

  private apiUrl = `${environment.apiUrl}/usuarios`;
  private institutosUrl = `${environment.apiUrl}/instituto`;

  constructor(private http: HttpClient, private authService: AuthService) {}

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  /**
   * Cargar la lista de usuarios desde el backend
   */
  cargarUsuarios(): void {
    this.loading = true;
    this.error = null;
    
    // Validar sesión antes de hacer la petición
    console.log('🔍 Validando sesión antes de cargar usuarios...');
    this.authService.revalidateSession();
    
    // Debug del token de autenticación
    const token = localStorage.getItem('auth_token') || this.authService.getToken();
    console.log('🔍 Debug de autenticación:');
    console.log('Token encontrado:', token ? '✅ Sí' : '❌ No');
    
    if (token) {
      console.log('Token (primeros 50 chars):', token.substring(0, 50) + '...');
      
      // Intentar decodificar el payload del JWT
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('🎯 Payload del token:', {
          sub: payload.sub,
          id: payload.id,
          roles: payload.roles || payload.role,
          exp: new Date(payload.exp * 1000).toISOString(),
          iat: new Date(payload.iat * 1000).toISOString()
        });
        
        // Verificar si el token ha expirado
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < now) {
          console.warn('⚠️ TOKEN EXPIRADO!');
          console.log('Token expiró en:', new Date(payload.exp * 1000));
          console.log('Hora actual:', new Date());
          this.error = 'Token expirado. Por favor, vuelve a iniciar sesión.';
          this.loading = false;
          return;
        }
        
        // Verificar rol de administrador
        const roles = payload.roles || payload.role;
        const isAdmin = roles === 3 || roles === '3' || 
                       (Array.isArray(roles) && roles.includes(3));
        
        console.log('👑 ¿Es administrador?:', isAdmin ? '✅ SÍ' : '❌ NO');
        
        if (!isAdmin) {
          console.warn('⚠️ USUARIO NO ES ADMINISTRADOR - Esto causará error 403');
          this.error = 'El usuario actual no tiene permisos de administrador.';
          this.loading = false;
          return;
        }
        
      } catch (e) {
        console.error('❌ Error al decodificar token:', e);
        this.error = 'Token inválido. Por favor, vuelve a iniciar sesión.';
        this.loading = false;
        return;
      }
    } else {
      this.error = 'No hay token de autenticación. Por favor, inicia sesión.';
      this.loading = false;
      return;
    }
    
    console.log('🔍 Cargando usuarios desde:', this.apiUrl);
    
    this.http.get<Usuario[]>(this.apiUrl).subscribe({
      next: (usuarios) => {
        this.usuarios = usuarios;
        this.loading = false;
        console.log('✅ Usuarios cargados:', usuarios.length, 'usuarios');
        console.log('📋 Datos recibidos:', usuarios);
        
        // Análisis de los datos para debug
        if (usuarios.length > 0) {
          const primerUsuario = usuarios[0];
          console.log('🔍 Estructura del primer usuario:', Object.keys(primerUsuario));
          console.log('🎯 Ejemplo de datos:', {
            nombres: primerUsuario.nombres,
            apellidos: primerUsuario.apellidos,
            cui: primerUsuario.cui,
            id_rol: primerUsuario.id_rol,
            estado: primerUsuario.estado,
            instituto: primerUsuario.instituto
          });
        }
      },
      error: (error) => {
        this.loading = false;
        
        // Diferentes tipos de error con mensajes específicos
        if (error.status === 0) {
          this.error = `No se puede conectar con el servidor. Verifique que el backend esté funcionando en ${environment.apiUrl}`;
        } else if (error.status === 401) {
          this.error = 'No autorizado. El token puede estar expirado o ser inválido.';
        } else if (error.status === 403) {
          this.error = 'Acceso prohibido. El usuario no tiene permisos para acceder a esta información.';
        } else if (error.status === 404) {
          this.error = 'Endpoint no encontrado. Verifique que la ruta /usuarios esté implementada en el backend.';
        } else if (error.status === 500) {
          this.error = 'Error interno del servidor. Revise los logs del backend.';
        } else {
          this.error = `Error ${error.status}: ${error.message || 'Error desconocido'}`;
        }
        
        console.error('❌ Error al cargar usuarios:', error);
        
        // Información detallada de debug para el backend
        console.group('🔍 INFORMACIÓN DE DEBUG PARA EL BACKEND:');
        console.log('URL solicitada:', this.apiUrl);
        console.log('Método HTTP:', 'GET');
        console.log('Status Code:', error.status);
        console.log('Status Text:', error.statusText);
        console.log('Error completo:', error);
        
        if (error.error) {
          console.log('Respuesta del servidor:', error.error);
        }
        
        // Headers enviados
        console.log('Headers enviados incluyen Authorization:', !!token);
        
        console.log('\n📋 VERIFICACIONES RECOMENDADAS:');
        console.log(`1. ¿El backend está ejecutándose en ${environment.apiUrl}?`);
        console.log('2. ¿Existe la ruta GET /usuarios en el backend?');
        console.log('3. ¿La ruta requiere autenticación y autorización?');
        console.log('4. ¿El token JWT es válido y no ha expirado?');
        console.log('5. ¿El usuario tiene el rol correcto (administrador = 3)?');
        console.log('6. ¿Hay middlewares de autorización bloqueando la petición?');
        
        if (error.status === 403) {
          console.log('\n🚫 ERROR 403 - FORBIDDEN:');
          console.log('Causas comunes:');
          console.log('- El endpoint requiere rol de administrador');
          console.log('- El token no contiene el rol correcto');
          console.log('- Middleware de autorización mal configurado');
          console.log('- El usuario existe pero no tiene permisos');
        }
        
        console.log('\n🔧 ESTRUCTURA ESPERADA DE RESPUESTA:');
        console.log(`[
  {
    "id_usuario": number,
    "id_rol": number,
    "nombres": string,
    "apellidos": string,
    "cui": string,
    "fecha_nacimiento": Date,
    "direccion": string,
    "telefono": string,
    "email": string,
    "ocupacion": string,
    "password": string,
    "instituto": number,
    "estado": number
  }
]`);
        console.groupEnd();
      }
    });
  }

  /**
   * Obtener usuarios filtrados
   */
  get usuariosFiltrados(): Usuario[] {
    const filtrados = this.usuarios.filter(usuario => {
      const cumpleNombre = !this.filtroNombre || 
        `${usuario.nombres} ${usuario.apellidos}`.toLowerCase().includes(this.filtroNombre.toLowerCase()) ||
        usuario.cui.includes(this.filtroNombre);
      
      // Comparación más robusta para rol (convirtiendo ambos a number para comparar)
      const cumpleRol = this.filtroRol === null || 
        Number(usuario.id_rol) === Number(this.filtroRol);
      
      // Comparación más robusta para estado (convirtiendo ambos a number para comparar)
      const cumpleEstado = this.filtroEstado === null || 
        Number(usuario.estado) === Number(this.filtroEstado);
      
      return cumpleNombre && cumpleRol && cumpleEstado;
    });

    return filtrados;
  }

  /**
   * Obtener nombre del rol
   */
  obtenerNombreRol(idRol: number | undefined): string {
    switch (idRol) {
      case 1: return 'Ciudadano';
      case 2: return 'Médico';
      case 3: return 'Administrador';
      case 4: return 'Consultor';
      default: return 'Sin rol';
    }
  }

  /**
   * Obtener estado del usuario
   */
  obtenerEstado(estado: number | undefined): string {
    return estado === 1 ? 'Activo' : 'Inactivo';
  }

  /**
   * Formatear fecha
   */
  formatearFecha(fecha: Date | string | undefined): string {
    if (!fecha) return 'No especificada';
    const fechaObj = typeof fecha === 'string' ? new Date(fecha) : fecha;
    return fechaObj.toLocaleDateString('es-GT');
  }

  /**
   * Manejar cambio de filtro de rol
   */
  onFiltroRolChange(nuevoRol: any): void {
    // Asegurar que el valor sea number o null
    if (nuevoRol === null || nuevoRol === undefined || nuevoRol === '') {
      this.filtroRol = null;
    } else {
      this.filtroRol = Number(nuevoRol);
    }
  }

  /**
   * Limpiar filtros
   */
  limpiarFiltros(): void {
    this.filtroNombre = '';
    this.filtroRol = null;
    this.filtroEstado = null;
  }

  /**
   * Recargar lista de usuarios
   */
  recargar(): void {
    this.cargarUsuarios();
  }

  /**
   * Abrir modal de edición
   */
  editarUsuario(usuario: Usuario): void {
    this.usuarioEditando = { ...usuario }; // Copia del usuario
    this.nuevoRol = usuario.id_rol || null;
    this.nuevoInstituto = usuario.instituto || null;
    this.errorEdicion = null;
    this.mostrarModalEdicion = true;
    
    // Los institutos ya están cargados estáticamente
  }



  /**
   * Guardar cambios del usuario
   */
  guardarCambiosUsuario(): void {
    if (!this.usuarioEditando) return;

    this.loadingEdicion = true;
    this.errorEdicion = null;

    // Preparar datos para enviar (solo los campos editables)
    const datosActualizacion: any = {};

    // Solo agregar rol si ha cambiado
    if (this.nuevoRol !== null && this.nuevoRol !== this.usuarioEditando.id_rol) {
      datosActualizacion.id_rol = this.nuevoRol;
    }

    // Solo agregar instituto si ha cambiado
    if (this.nuevoInstituto !== this.usuarioEditando.instituto) {
      datosActualizacion.instituto = this.nuevoInstituto;
    }

    // Verificar que hay cambios para enviar
    if (Object.keys(datosActualizacion).length === 0) {
      this.loadingEdicion = false;
      this.errorEdicion = 'No hay cambios para guardar.';
      return;
    }

    console.log('📤 Enviando actualización de usuario:', datosActualizacion);

    // Realizar petición PUT al backend
    this.http.put(`${this.apiUrl}/${this.usuarioEditando.id_usuario}`, datosActualizacion).subscribe({
      next: (response) => {
        this.loadingEdicion = false;
        console.log('✅ Usuario actualizado exitosamente:', response);
        
        // Actualizar el usuario en la lista local
        const index = this.usuarios.findIndex(u => u.id_usuario === this.usuarioEditando?.id_usuario);
        if (index !== -1) {
          // Solo actualizar los campos que fueron modificados
          if (datosActualizacion.id_rol !== undefined) {
            this.usuarios[index].id_rol = datosActualizacion.id_rol;
          }
          if (datosActualizacion.instituto !== undefined) {
            this.usuarios[index].instituto = datosActualizacion.instituto;
          }
        }
        
        // Cerrar modal
        this.cerrarModalEdicion();
        
        // Mostrar mensaje de éxito
        alert('✅ Usuario actualizado exitosamente');
      },
      error: (error) => {
        this.loadingEdicion = false;
        console.error('❌ Error al actualizar usuario:', error);
        
        if (error.status === 0) {
          this.errorEdicion = 'No se puede conectar con el servidor.';
        } else if (error.status === 401) {
          this.errorEdicion = 'No autorizado. Tu sesión puede haber expirado.';
        } else if (error.status === 403) {
          this.errorEdicion = 'No tienes permisos para editar usuarios.';
        } else if (error.status === 404) {
          this.errorEdicion = 'Usuario no encontrado.';
        } else if (error.status === 422 || error.status === 400) {
          this.errorEdicion = 'Datos inválidos. Verifica la información ingresada.';
        } else {
          this.errorEdicion = `Error al actualizar: ${error.status} - ${error.message || 'Error desconocido'}`;
        }
      }
    });
  }

  /**
   * Cerrar modal de edición
   */
  cerrarModalEdicion(): void {
    this.mostrarModalEdicion = false;
    this.usuarioEditando = null;
    this.nuevoRol = null;
    this.nuevoInstituto = null;
    this.errorEdicion = null;
  }

  /**
   * Obtener nombre del instituto por ID
   */
  obtenerNombreInstituto(idInstituto: number | null | undefined): string {
    if (!idInstituto) return 'Sin instituto';
    
    const instituto = this.institutos.find(i => i.id_centro === idInstituto);
    return instituto ? instituto.nombre : `Centro ID: ${idInstituto}`;
  }

  /**
   * Verificar si hay cambios para guardar
   */
  get hayCambios(): boolean {
    if (!this.usuarioEditando) return false;
    
    const rolCambiado = this.nuevoRol !== null && this.nuevoRol !== this.usuarioEditando.id_rol;
    const institutoCambiado = this.nuevoInstituto !== this.usuarioEditando.instituto;
    
    return rolCambiado || institutoCambiado;
  }

  /**
   * Verificar si un usuario está siendo eliminado
   */
  estaEliminando(idUsuario: number | undefined): boolean {
    return idUsuario ? this.usuariosEliminando.has(idUsuario) : false;
  }

  /**
   * Eliminar usuario
   */
  eliminarUsuario(usuario: Usuario): void {
    const confirmar = confirm(
      `¿Estás seguro de que quieres eliminar al usuario?\n\n` +
      `Nombre: ${usuario.nombres} ${usuario.apellidos}\n` +
      `CUI: ${usuario.cui}\n\n` +
      `Esta acción no se puede deshacer.`
    );

    if (confirmar) {
      // Agregar el usuario al conjunto de usuarios en proceso de eliminación
      this.usuariosEliminando.add(usuario.id_usuario!);
      
      console.log('🗑️ Eliminando usuario:', usuario.id_usuario);

      // Hacer petición DELETE al backend
      this.http.delete(`${this.apiUrl}/${usuario.id_usuario}`).subscribe({
        next: (response) => {
          console.log('✅ Usuario eliminado exitosamente:', response);
          
          // Remover el usuario de la lista local
          this.usuarios = this.usuarios.filter(u => u.id_usuario !== usuario.id_usuario);
          
          // Remover del conjunto de eliminación
          this.usuariosEliminando.delete(usuario.id_usuario!);
          
          // Mostrar mensaje de éxito
          alert(`✅ Usuario "${usuario.nombres} ${usuario.apellidos}" eliminado exitosamente.`);
        },
        error: (error) => {
          console.error('❌ Error al eliminar usuario:', error);
          
          // Remover del conjunto de eliminación en caso de error
          this.usuariosEliminando.delete(usuario.id_usuario!);
          
          // Mostrar mensaje de error según el tipo
          let mensajeError = 'Error al eliminar el usuario.';
          
          if (error.status === 0) {
            mensajeError = 'No se puede conectar con el servidor.';
          } else if (error.status === 401) {
            mensajeError = 'No autorizado. Tu sesión puede haber expirado.';
          } else if (error.status === 403) {
            mensajeError = 'No tienes permisos para eliminar usuarios.';
          } else if (error.status === 404) {
            mensajeError = 'Usuario no encontrado.';
          } else if (error.status === 409) {
            mensajeError = 'No se puede eliminar: el usuario tiene registros asociados.';
          } else if (error.status >= 500) {
            mensajeError = 'Error del servidor. Inténtalo más tarde.';
          }
          
          alert(`❌ ${mensajeError}`);
        }
      });
    }
  }
}
