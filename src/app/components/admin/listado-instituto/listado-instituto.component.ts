import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Instituto } from '../../../interfaces/instituto';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-listado-instituto',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './listado-instituto.component.html',
  styleUrl: './listado-instituto.component.css'
})
export class ListadoInstitutoComponent implements OnInit {
  institutos: Instituto[] = [];
  loading = false;
  error: string | null = null;
  
  // Filtros
  filtroNombre = '';
  
  // Modal de edición
  mostrarModalEdicion = false;
  institutoEditando: Instituto | null = null;
  loadingEdicion = false;
  errorEdicion: string | null = null;
  
  // Modal de creación
  mostrarModalCreacion = false;
  nuevoInstituto: {
    nombre: string;
    id_area?: number;
    direccion?: string;
    telefono?: string;
    email?: string;
  } = {
    nombre: ''
  };
  loadingCreacion = false;
  errorCreacion: string | null = null;
  
  // Control de eliminación
  institutosEliminando: Set<number> = new Set();
  
  private apiUrl = `${environment.apiUrl}/instituto`;
  
  constructor(private http: HttpClient, private authService: AuthService) {}
  
  ngOnInit(): void {
    this.cargarInstitutos();
  }
  
  /**
   * Cargar la lista de institutos desde el backend
   */
  cargarInstitutos(): void {
    this.loading = true;
    this.error = null;
    
    this.http.get<Instituto[]>(this.apiUrl).subscribe({
      next: (institutos) => {
        this.institutos = institutos;
        this.loading = false;
        console.log('✅ Institutos cargados:', institutos.length, 'institutos');
      },
      error: (error) => {
        this.loading = false;
        console.error('❌ Error al cargar institutos:', error);
        
        if (error.status === 0) {
          this.error = 'No se puede conectar con el servidor.';
        } else if (error.status === 401) {
          this.error = 'No autorizado. Tu sesión puede haber expirado.';
          this.authService.logout();
        } else if (error.status === 403) {
          this.error = 'No tienes permisos para acceder a los institutos.';
        } else {
          this.error = `Error al cargar institutos: ${error.status}`;
        }
      }
    });
  }
  
  /**
   * Obtener institutos filtrados
   */
  get institutosFiltrados(): Instituto[] {
    if (!this.filtroNombre.trim()) {
      return this.institutos;
    }
    
    const filtro = this.filtroNombre.toLowerCase();
    return this.institutos.filter(instituto => 
      instituto.nombre.toLowerCase().includes(filtro) ||
      instituto.direccion?.toLowerCase().includes(filtro) ||
      instituto.email?.toLowerCase().includes(filtro)
    );
  }
  
  /**
   * Limpiar filtros
   */
  limpiarFiltros(): void {
    this.filtroNombre = '';
  }
  
  /**
   * Recargar lista de institutos
   */
  recargar(): void {
    this.cargarInstitutos();
  }
  
  /**
   * Abrir modal de edición
   */
  editarInstituto(instituto: Instituto): void {
    this.institutoEditando = { ...instituto }; // Copia del instituto
    this.errorEdicion = null;
    this.mostrarModalEdicion = true;
  }
  
  /**
   * Cerrar modal de edición
   */
  cerrarModalEdicion(): void {
    this.mostrarModalEdicion = false;
    this.institutoEditando = null;
    this.errorEdicion = null;
    this.loadingEdicion = false;
  }
  
  /**
   * Guardar cambios del instituto
   */
  guardarCambiosInstituto(): void {
    if (!this.institutoEditando) return;
    
    this.loadingEdicion = true;
    this.errorEdicion = null;
    
    console.log('📤 Enviando actualización de instituto:', this.institutoEditando);
    
    // Realizar petición PUT al backend
    this.http.put(`${this.apiUrl}/${this.institutoEditando.id_centro}`, this.institutoEditando).subscribe({
      next: (response) => {
        this.loadingEdicion = false;
        console.log('✅ Instituto actualizado exitosamente:', response);
        
        // Actualizar el instituto en la lista local
        const index = this.institutos.findIndex(i => i.id_centro === this.institutoEditando?.id_centro);
        if (index !== -1 && this.institutoEditando) {
          this.institutos[index] = { ...this.institutoEditando };
        }
        
        // Cerrar modal
        this.cerrarModalEdicion();
        
        // Mostrar mensaje de éxito
        alert('✅ Instituto actualizado exitosamente');
      },
      error: (error) => {
        this.loadingEdicion = false;
        console.error('❌ Error al actualizar instituto:', error);
        
        if (error.status === 0) {
          this.errorEdicion = 'No se puede conectar con el servidor.';
        } else if (error.status === 401) {
          this.errorEdicion = 'No autorizado. Tu sesión puede haber expirado.';
        } else if (error.status === 403) {
          this.errorEdicion = 'No tienes permisos para editar institutos.';
        } else if (error.status === 404) {
          this.errorEdicion = 'Instituto no encontrado.';
        } else if (error.status === 422 || error.status === 400) {
          this.errorEdicion = 'Datos inválidos. Verifica la información ingresada.';
        } else {
          this.errorEdicion = `Error del servidor: ${error.status}`;
        }
      }
    });
  }
  
  /**
   * Verificar si un instituto está siendo eliminado
   */
  estaEliminando(idInstituto: number | undefined): boolean {
    return idInstituto ? this.institutosEliminando.has(idInstituto) : false;
  }
  
  /**
   * Eliminar instituto
   */
  eliminarInstituto(instituto: Instituto): void {
    const confirmar = confirm(
      `¿Estás seguro de que quieres eliminar el instituto?\n\n` +
      `Nombre: ${instituto.nombre}\n` +
      `Dirección: ${instituto.direccion}\n\n` +
      `Esta acción no se puede deshacer.`
    );
    
    if (confirmar) {
      // Agregar el instituto al conjunto de institutos en proceso de eliminación
      this.institutosEliminando.add(instituto.id_centro!);
      
      console.log('🗑️ Eliminando instituto:', instituto.id_centro);
      
      // Hacer petición DELETE al backend
      this.http.delete(`${this.apiUrl}/${instituto.id_centro}`).subscribe({
        next: (response) => {
          console.log('✅ Instituto eliminado exitosamente:', response);
          
          // Remover el instituto de la lista local
          this.institutos = this.institutos.filter(i => i.id_centro !== instituto.id_centro);
          
          // Remover del conjunto de eliminación
          this.institutosEliminando.delete(instituto.id_centro!);
          
          // Mostrar mensaje de éxito
          alert(`✅ Instituto "${instituto.nombre}" eliminado exitosamente.`);
        },
        error: (error) => {
          console.error('❌ Error al eliminar instituto:', error);
          
          // Remover del conjunto de eliminación en caso de error
          this.institutosEliminando.delete(instituto.id_centro!);
          
          // Mostrar mensaje de error según el tipo
          let mensajeError = 'Error al eliminar el instituto.';
          
          if (error.status === 0) {
            mensajeError = 'No se puede conectar con el servidor.';
          } else if (error.status === 401) {
            mensajeError = 'No autorizado. Tu sesión puede haber expirado.';
          } else if (error.status === 403) {
            mensajeError = 'No tienes permisos para eliminar institutos.';
          } else if (error.status === 404) {
            mensajeError = 'Instituto no encontrado.';
          } else if (error.status === 409) {
            mensajeError = 'No se puede eliminar: el instituto tiene registros asociados.';
          } else if (error.status >= 500) {
            mensajeError = 'Error del servidor. Inténtalo más tarde.';
          }
          
          alert(`❌ ${mensajeError}`);
        }
      });
    }
  }

  /**
   * Abrir modal de creación
   */
  abrirModalCreacion(): void {
    this.nuevoInstituto = {
      nombre: ''
    };
    this.errorCreacion = null;
    this.mostrarModalCreacion = true;
  }

  /**
   * Cerrar modal de creación
   */
  cerrarModalCreacion(): void {
    this.mostrarModalCreacion = false;
    this.nuevoInstituto = {
      nombre: ''
    };
    this.errorCreacion = null;
    this.loadingCreacion = false;
  }

  /**
   * Crear nuevo instituto
   */
  crearInstituto(): void {
    if (!this.nuevoInstituto.nombre?.trim()) {
      this.errorCreacion = 'El nombre del instituto es obligatorio.';
      return;
    }

    this.loadingCreacion = true;
    this.errorCreacion = null;

    // Preparar datos para envío
    const institutoData = {
      nombre: this.nuevoInstituto.nombre.trim(),
      ...(this.nuevoInstituto.id_area && { id_area: this.nuevoInstituto.id_area }),
      ...(this.nuevoInstituto.direccion?.trim() && { direccion: this.nuevoInstituto.direccion.trim() }),
      ...(this.nuevoInstituto.telefono?.trim() && { telefono: this.nuevoInstituto.telefono.trim() }),
      ...(this.nuevoInstituto.email?.trim() && { email: this.nuevoInstituto.email.trim() })
    };

    console.log('📤 Enviando nuevo instituto:', institutoData);

    this.http.post<Instituto>(this.apiUrl, institutoData).subscribe({
      next: (response) => {
        console.log('✅ Instituto creado exitosamente:', response);
        
        // Agregar el nuevo instituto a la lista local
        this.institutos.push(response);
        
        // Cerrar modal
        this.cerrarModalCreacion();
        
        // Mostrar mensaje de éxito
        alert('✅ Instituto creado exitosamente');
      },
      error: (error) => {
        this.loadingCreacion = false;
        console.error('❌ Error al crear instituto:', error);
        
        if (error.status === 0) {
          this.errorCreacion = 'No se puede conectar con el servidor.';
        } else if (error.status === 400) {
          this.errorCreacion = error.error?.message || 'Datos inválidos. Verifica la información.';
        } else if (error.status === 401) {
          this.errorCreacion = 'No autorizado. Tu sesión puede haber expirado.';
        } else if (error.status === 403) {
          this.errorCreacion = 'No tienes permisos para crear institutos.';
        } else if (error.status === 409) {
          this.errorCreacion = 'Ya existe un instituto con ese nombre.';
        } else if (error.status >= 500) {
          this.errorCreacion = 'Error del servidor. Inténtalo más tarde.';
        } else {
          this.errorCreacion = 'Error inesperado al crear instituto.';
        }
      }
    });
  }
}
