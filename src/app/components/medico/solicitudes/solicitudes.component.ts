import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { SolicitudTarjetaService } from '../../../services/solicitud-tarjeta.service';
import { AuthService } from '../../../services/auth.service';

export interface SolicitudTarjeta {
  // Campos tal como vienen del backend
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
  
  // Campos adicionales para compatibilidad
  id?: number; // alias para id_solicitud
  correlativo?: string;
  ciudadano?: {
    id_usuario?: number;
    id_rol?: number;
    nombres: string;
    apellidos: string;
    cui?: string;
    email?: string;
    password?: string;
    fecha_nacimiento?: string;
    direccion?: string;
    telefono?: string;
    ocupacion?: string;
    instituto?: number | null;
    rol?: {
      id_rol: number;
      descripcion: string;
    };
    // Campos alternativos para compatibilidad
    id?: number;
    nombre?: string;
    apellido?: string;
  };
  centro_salud?: string;
  nombre_ciudadano?: string;
  apellido_ciudadano?: string;
  cui_ciudadano?: string;
  cargandoDatos?: boolean; // para mostrar loading mientras se cargan datos del ciudadano
  [key: string]: any;
}

@Component({
  selector: 'app-solicitudes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './solicitudes.component.html',
  styleUrl: './solicitudes.component.css'
})
export class SolicitudesComponent implements OnInit {
  
  // Filtros
  tramiteSeleccionado: string = '';
  tipoSeleccionado: string = '';
  correlativo: string = '';

  // Estados de carga
  cargandoSolicitudes = false;
  errorCarga = '';

  // Opciones para los dropdowns
  tiposTramite = [
    { value: '', label: 'Todos los trámites' },
    { value: 'pendiente', label: 'Pendientes' },
    { value: 'aprobado', label: 'Aprobados' },
    { value: 'rechazado', label: 'Rechazados' }
  ];

  tiposTarjeta = [
    { value: '', label: 'Todos los tipos' },
    { value: '1', label: 'Tarjeta de Salud' },
    { value: '2', label: 'Manipulación de Alimentos' }
  ];

  // Lista de solicitudes del backend
  solicitudes: SolicitudTarjeta[] = [];
  solicitudesFiltradas: SolicitudTarjeta[] = [];

  constructor(
    private solicitudService: SolicitudTarjetaService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.cargarSolicitudesPendientes();
  }

  cargarSolicitudesPendientes(): void {
    const idCentro = this.authService.getUserInstituto();
    
    if (!idCentro) {
      this.errorCarga = 'No se pudo obtener el centro de salud del usuario';
      return;
    }

    this.cargandoSolicitudes = true;
    this.errorCarga = '';

    this.solicitudService.getSolicitudesPendientes(idCentro).subscribe({
      next: (solicitudes) => {
        console.log('🔍 Solicitudes obtenidas del backend:', solicitudes);
        console.log('📊 Primera solicitud (estructura):', solicitudes[0]);
        console.log('🗂️ Campos disponibles:', solicitudes[0] ? Object.keys(solicitudes[0]) : 'No hay solicitudes');
        
        // Agregar alias para compatibilidad y marcar como cargando datos
        this.solicitudes = solicitudes.map(solicitud => ({
          ...solicitud,
          id: solicitud.id_solicitud, // alias para compatibilidad
          cargandoDatos: true // indicar que se están cargando los datos del ciudadano
        }));
        
        // Cargar datos de los ciudadanos
        this.cargarDatosCiudadanos();
        
        this.aplicarFiltros();
        this.cargandoSolicitudes = false;
      },
      error: (error) => {
        console.error('Error al cargar solicitudes:', error);
        this.errorCarga = 'Error al cargar las solicitudes. Inténtalo de nuevo.';
        this.cargandoSolicitudes = false;
      }
    });
  }

  cargarDatosCiudadanos(): void {
    // Obtener IDs únicos de ciudadanos
    const ciudadanoIds = [...new Set(this.solicitudes.map(s => s.id_ciudadano))];
    
    console.log('🔍 Cargando datos de ciudadanos para IDs:', ciudadanoIds);
    
    if (ciudadanoIds.length === 0) {
      return;
    }

    // Crear array de observables para obtener datos de cada ciudadano
    const solicitudesUsuarios = ciudadanoIds.map(id => 
      this.solicitudService.getUsuarioById(id)
    );

    // Ejecutar todas las llamadas en paralelo
    forkJoin(solicitudesUsuarios).subscribe({
      next: (usuarios) => {
        console.log('✅ Datos de usuarios obtenidos:', usuarios);
        
        // Crear un mapa para acceso rápido
        const usuariosMap = new Map();
        ciudadanoIds.forEach((id, index) => {
          usuariosMap.set(id, usuarios[index]);
        });

        // Actualizar solicitudes con datos de ciudadanos
        this.solicitudes = this.solicitudes.map(solicitud => ({
          ...solicitud,
          ciudadano: usuariosMap.get(solicitud.id_ciudadano) || null,
          cargandoDatos: false
        }));

        console.log('🎉 Nombres de ciudadanos cargados exitosamente');

        // Reaplicar filtros con los nuevos datos
        this.aplicarFiltros();
      },
      error: (error) => {
        console.error('❌ Error al cargar datos de ciudadanos:', error);
        
        // Marcar como no cargando aunque haya error
        this.solicitudes = this.solicitudes.map(s => ({ ...s, cargandoDatos: false }));
        this.aplicarFiltros();
      }
    });
  }

  aplicarFiltros(): void {
    this.solicitudesFiltradas = this.solicitudes.filter(solicitud => {
      const estadoTexto = this.getEstadoTexto(solicitud.estado);
      const coincideTramite = !this.tramiteSeleccionado || 
        estadoTexto.toLowerCase().includes(this.tramiteSeleccionado.toLowerCase());
      
      const tipoTarjeta = String(solicitud.tipo_tarjeta);
      const coincideTipo = !this.tipoSeleccionado || 
        tipoTarjeta === this.tipoSeleccionado;
      
      const correlativo = solicitud.correlativo || '';
      const nombreCiudadano = this.getNombreCiudadano(solicitud);
      const coincideCorrelativo = !this.correlativo || 
        correlativo.toLowerCase().includes(this.correlativo.toLowerCase()) ||
        nombreCiudadano.toLowerCase().includes(this.correlativo.toLowerCase());

      return coincideTramite && coincideTipo && coincideCorrelativo;
    });
  }

  // Método auxiliar para convertir estado numérico a texto
  getEstadoTexto(estado: number): string {
    switch (estado) {
      case 1: return 'pendiente';
      case 2: return 'aprobado';
      case 3: return 'rechazado';
      default: return 'desconocido';
    }
  }

  // Método auxiliar para obtener el nombre del ciudadano
  getNombreCiudadano(solicitud: any): string {
    // Si se están cargando los datos
    if (solicitud.cargandoDatos) {
      return 'Cargando...';
    }

    // Si hay un objeto ciudadano con los datos cargados
    if (solicitud.ciudadano && typeof solicitud.ciudadano === 'object') {
      // Usar los nombres de campos correctos del backend
      const nombres = solicitud.ciudadano.nombres || solicitud.ciudadano.nombre || '';
      const apellidos = solicitud.ciudadano.apellidos || solicitud.ciudadano.apellido || '';
      
      if (nombres || apellidos) {
        return `${nombres} ${apellidos}`.trim();
      }
    }
    
    // Si hay un string directo
    if (solicitud.ciudadano && typeof solicitud.ciudadano === 'string') {
      return solicitud.ciudadano;
    }
    
    // Si los campos vienen directamente en la solicitud
    if (solicitud.nombre_ciudadano || solicitud.apellido_ciudadano) {
      return `${solicitud.nombre_ciudadano || ''} ${solicitud.apellido_ciudadano || ''}`.trim();
    }
    
    // Fallback: mostrar el ID del ciudadano
    if (solicitud.id_ciudadano) {
      return `Ciudadano ID: ${solicitud.id_ciudadano}`;
    }
    
    return 'Sin datos';
  }

  // Método auxiliar para obtener el nombre del tipo de tarjeta
  getTipoTarjetaLabel(tipo: number | string): string {
    const tipoNum = Number(tipo);
    return tipoNum === 1 ? 'Tarjeta de Salud' : 'Manipulación de Alimentos';
  }

  onFiltroChange(): void {
    this.aplicarFiltros();
  }

  aprobarSolicitud(solicitud: SolicitudTarjeta): void {
    if (confirm(`¿Está seguro de que desea aprobar la solicitud ${solicitud.id_solicitud}?`)) {
      try {
        this.solicitudService.aprobarSolicitud(solicitud.id_solicitud).subscribe({
          next: (response) => {
            console.log('✅ Solicitud aprobada exitosamente:', response);
            // Actualizar el estado localmente
            solicitud.estado = 2; // 2 = aprobado
            this.aplicarFiltros();
            
            // Mostrar mensaje de éxito
            alert('Solicitud aprobada exitosamente');
          },
          error: (error) => {
            console.error('❌ Error al aprobar solicitud:', error);
            
            // Verificar si es el error específico del backend sobre la creación de tarjetas
            if (error.message && error.message.includes('tarjeta automáticamente')) {
              alert('❌ Error del sistema: Hay un problema técnico en el backend relacionado con la creación automática de tarjetas.\n\n' +
                   '📋 La solicitud no pudo ser aprobada debido a un error en la base de datos.\n\n' +
                   '🔧 Por favor contacte al administrador del sistema para revisar el esquema de la base de datos.\n\n' +
                   '📝 Detalles técnicos disponibles en la consola del navegador.');
            } else {
              alert('❌ Error al aprobar la solicitud.\n\nPor favor inténtelo de nuevo o contacte al administrador si el problema persiste.');
            }
          }
        });
      } catch (error: any) {
        console.error('❌ Error antes de enviar solicitud:', error);
        alert(error.message || 'Error al procesar la solicitud. Verifique que esté logueado correctamente.');
      }
    }
  }

  rechazarSolicitud(solicitud: SolicitudTarjeta): void {
    const motivo = prompt('Ingrese el motivo del rechazo (opcional):');
    
    // Si el usuario canceló el prompt, no hacer nada
    if (motivo === null) {
      return;
    }

    if (confirm(`¿Está seguro de que desea rechazar la solicitud ${solicitud.id_solicitud}?`)) {
      try {
        this.solicitudService.rechazarSolicitud(solicitud.id_solicitud, motivo).subscribe({
          next: (response) => {
            console.log('✅ Solicitud rechazada exitosamente:', response);
            // Actualizar el estado localmente
            solicitud.estado = 3; // 3 = rechazado
            this.aplicarFiltros();
            
            // Mostrar mensaje de éxito
            alert('Solicitud rechazada exitosamente');
          },
          error: (error) => {
            console.error('❌ Error al rechazar solicitud:', error);
            alert('Error al rechazar la solicitud. Inténtelo de nuevo.');
          }
        });
      } catch (error: any) {
        console.error('❌ Error antes de enviar solicitud:', error);
        alert(error.message || 'Error al procesar la solicitud. Verifique que esté logueado correctamente.');
      }
    }
  }

  verExamenMedico(url: string): void {
    if (url) {
      window.open(url, '_blank');
    }
  }
}
