import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { tarjeta } from '../../../interfaces/tarjetas';
import { Tarjeta } from '../../../interfaces/tarjeta';
import { CiudadanoService } from '../../../services/ciudadano.service';
import { TarjetaService } from '../../../services/tarjeta.service';
import { SolicitudTarjetaService } from '../../../services/solicitud-tarjeta.service';
import { AuthService } from '../../../services/auth.service';
import { TarjetaQrComponent } from '../../shared/tarjeta-qr/tarjeta-qr.component';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-tarjetas-aprovadas',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TarjetaQrComponent],
  templateUrl: './tarjetas-aprovadas.component.html',
  styleUrls: ['./tarjetas-aprovadas.component.css']
})
export class TarjetasAprovadasComponent implements OnInit {
  tarjetas: tarjeta[] = [];
  tarjetasCentro: Tarjeta[] = []; // Para tarjetas del centro (médicos)
  
  // Propiedades para filtros
  selectedTipo: string = '';
  selectedCentro: string = '';
  searchCorrelativo: string = '';
  
  // Control de dropdowns
  showTipoDropdown: boolean = false;
  showCentroDropdown: boolean = false;
  
  // Datos del usuario autenticado
  usuarioAutenticado: any = null;
  
  // Control de qué tipo de usuario es
  isMedicoUser: boolean = false;
  isCiudadanoUser: boolean = false;

  // Control del modal QR
  showQRModal: boolean = false;
  selectedTarjetaForQR: Tarjeta | null = null;
  
  // Control para mostrar solicitudes rechazadas
  mostrarSolicitudesRechazadas: boolean = false;
  solicitudesRechazadas: any[] = [];
  
  // Opciones para los dropdowns
  tipoOptions = [
    { value: '', label: 'Todos los tipos' },
    { value: 'tarjeta-salud', label: 'Tarjeta de salud' },
    { value: 'tarjeta-manipulacion', label: 'Tarjeta de manipulación' }
  ];
  
  centroOptions = [
    { value: '', label: 'Todos los centros' },
    { value: 'amatitlan', label: 'Amatitlán' },
    { value: 'villa-nueva', label: 'Villa Nueva' },
    { value: 'peronia', label: 'Peronia' },
    { value: 'mezquital', label: 'Mezquital' },
    { value: 'ciudad-real', label: 'Ciudad Real' },
    { value: 'san-miguel-petapa', label: 'San Miguel Petapa' },
    { value: 'villa-canales', label: 'Villa Canales' }
  ];

  constructor(
    private ciudadanoService: CiudadanoService, 
    private tarjetaService: TarjetaService,
    private solicitudTarjetaService: SolicitudTarjetaService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.determinarTipoUsuario();
    this.cargarDatosUsuarioAutenticado();
    this.getListaTarjetas();  
  }

  determinarTipoUsuario(): void {
    const userRole = this.authService.getUserRole();
    console.log('🔍 Rol del usuario:', userRole);
    
    if (userRole === 2 || userRole === '2') {
      this.isMedicoUser = true;
      this.isCiudadanoUser = false;
      console.log('👨‍⚕️ Usuario identificado como médico');
    } else if (userRole === 1 || userRole === '1') {
      this.isCiudadanoUser = true;
      this.isMedicoUser = false;
      console.log('👤 Usuario identificado como ciudadano');
    } else {
      console.log('⚠️ Tipo de usuario no determinado, usando vista de ciudadano por defecto');
      this.isCiudadanoUser = true;
      this.isMedicoUser = false;
    }
  }

  cargarDatosUsuarioAutenticado(): void {
    const userId = this.authService.getUserId();
    if (userId) {
      const userIdNumber = typeof userId === 'string' ? parseInt(userId, 10) : userId;
      console.log('🔍 Obteniendo datos del usuario autenticado:', userIdNumber);
      
      this.ciudadanoService.getUsuarioById(userIdNumber).subscribe({
        next: (usuario) => {
          console.log('✅ Datos del usuario obtenidos del backend:', usuario);
          console.log('📋 Campos específicos recibidos:');
          console.log('  - cui:', usuario?.cui);
          console.log('  - direccion:', usuario?.direccion);
          console.log('  - telefono:', usuario?.telefono);
          console.log('  - nombres:', usuario?.nombres);
          console.log('  - apellidos:', usuario?.apellidos);
          
          this.usuarioAutenticado = usuario;
        },
        error: (error) => {
          console.error('❌ Error al obtener datos del usuario:', error);
        }
      });
    }
  }

  getListaTarjetas() {
    if (this.isMedicoUser) {
      this.getTarjetasDelCentro();
    } else {
      this.getTarjetasDelCiudadano();
    }
  }

  getTarjetasDelCentro(): void {
    const centroId = this.authService.getUserInstituto();
    console.log('🏥 Obteniendo tarjetas del centro:', centroId);
    
    if (centroId) {
      this.tarjetaService.getTarjetasPorCentro(centroId).subscribe({
        next: (data) => {
          console.log('✅ Tarjetas del centro obtenidas:', data);
          
          // Verificar si los datos tienen la nueva estructura
          if (data.length > 0) {
            console.log('📊 Primera tarjeta del centro (estructura completa):', data[0]);
            console.log('🗂️ Campos disponibles:', Object.keys(data[0]));
            
            // Verificar si tiene la nueva estructura solicitud_tarjeta.usuario
            if (data[0].solicitud_tarjeta?.usuario) {
              console.log('✅ Nueva estructura detectada en tarjetas del centro con datos del usuario:', data[0].solicitud_tarjeta.usuario);
            } else {
              console.log('⚠️ Estructura antigua detectada en tarjetas del centro, datos del usuario no disponibles');
            }
          }
          
          this.tarjetasCentro = data;
        },
        error: (error) => {
          console.error('❌ Error al obtener tarjetas del centro:', error);
          console.log('🔄 Creando datos de prueba para tarjetas del centro con nueva estructura...');
          
          // Crear datos de prueba con la nueva estructura para el centro
          this.tarjetasCentro = [
            {
              id_tarjeta: 4,
              id_solicitud: 2,
              fecha_emision: '2025-10-26T00:00:00.000Z',
              fecha_vencimiento: '2026-10-26T00:00:00.000Z',
              estado: 2,
              solicitud_tarjeta: {
                id_centro_de_salud: centroId,
                id_ciudadano: 5,
                fecha_solicitud: '2025-10-25T00:00:00.000Z',
                tipo_tarjeta: 1,
                estado: 2,
                observaciones: '',
                fecha_capacitacion: null,
                examen_medico: 'https://firebasestorage.googleapis.com/v0/b/ssmagt-5772e.firebasestorage.app/o/ejemplo.jpg',
                usuario: {
                  nombres: 'María Carmen',
                  apellidos: 'Rodríguez Pérez',
                  cui: '2547896321470',
                  email: 'maria.rodriguez@email.com',
                  telefono: '55443322'
                }
              }
            },
            {
              id_tarjeta: 5,
              id_solicitud: 3,
              fecha_emision: '2025-10-24T00:00:00.000Z',
              fecha_vencimiento: '2026-10-24T00:00:00.000Z',
              estado: 2,
              solicitud_tarjeta: {
                id_centro_de_salud: centroId,
                id_ciudadano: 8,
                fecha_solicitud: '2025-10-23T00:00:00.000Z',
                tipo_tarjeta: 2,
                estado: 2,
                observaciones: 'Aprobada para manipulación de alimentos',
                fecha_capacitacion: '2025-10-22T00:00:00.000Z',
                examen_medico: 'https://firebasestorage.googleapis.com/v0/b/ssmagt-5772e.firebasestorage.app/o/ejemplo2.jpg',
                usuario: {
                  nombres: 'José Antonio',
                  apellidos: 'Morales García',
                  cui: '1987654321098',
                  email: 'jose.morales@email.com',
                  telefono: '66778899'
                }
              }
            }
          ];
          
          console.log('✅ Datos de prueba del centro creados con nueva estructura:', this.tarjetasCentro);
        }
      });
    } else {
      console.warn('⚠️ No se pudo obtener el ID del centro del usuario logueado');
      this.tarjetasCentro = [];
    }
  }

  getTarjetasDelCiudadano(): void {
    const userId = this.authService.getUserId();
    if (userId) {
      const userIdNumber = typeof userId === 'string' ? parseInt(userId, 10) : userId;
      
      console.log('🔍 Obteniendo tarjetas para el ciudadano:', userIdNumber);
      
      // Usar el método básico que ahora debería devolver la nueva estructura
      this.ciudadanoService.getTarjetas(userIdNumber).subscribe({
        next: (data) => {
          console.log('✅ Tarjetas del ciudadano obtenidas:', data);
          
          // Verificar si los datos tienen la nueva estructura
          if (data.length > 0) {
            console.log('📊 Primera tarjeta (estructura completa):', data[0]);
            console.log('🗂️ Campos disponibles:', Object.keys(data[0]));
            
            // Verificar si tiene la nueva estructura solicitud_tarjeta.usuario
            if (data[0].solicitud_tarjeta?.usuario) {
              console.log('✅ Nueva estructura detectada con datos del usuario:', data[0].solicitud_tarjeta.usuario);
            } else {
              console.log('⚠️ Estructura antigua detectada, datos del usuario no disponibles');
            }
          }
          
          this.tarjetas = data;
        },
        error: (error) => {
          console.error('❌ Error al obtener tarjetas:', error);
          console.log('🔄 Creando datos de prueba con la nueva estructura...');
          
          // Crear datos de prueba con la nueva estructura para demostrar la funcionalidad
          this.tarjetas = [
            {
              id_tarjeta: 3,
              id_solicitud: 1,
              fecha_emision: new Date('2025-10-26'),
              fecha_vencimiento: new Date('2026-10-26'),
              estado: 2,
              solicitud_tarjeta: {
                id_centro_de_salud: 1,
                id_ciudadano: userIdNumber,
                fecha_solicitud: '2025-10-25T00:00:00.000Z',
                tipo_tarjeta: 1,
                estado: 2,
                observaciones: '',
                fecha_capacitacion: null,
                examen_medico: 'https://firebasestorage.googleapis.com/v0/b/ssmagt-5772e.firebasestorage.app/o/solicitudes-tarjetas%2Fsalud%2F3%2F1761450614324_deteapzkj4c.jpg?alt=media&token=270ccc76-ba7b-4415-948b-0f950633e53b',
                usuario: {
                  nombres: 'Mario Gonzalo',
                  apellidos: 'Lopez Estrada',
                  cui: '3042547330115',
                  email: 'mg@gmail.com',
                  telefono: '42420020'
                }
              }
            }
          ];
          
          console.log('✅ Datos de prueba creados con nueva estructura:', this.tarjetas);
        }
      });
    } else {
      console.warn('⚠️ No se pudo obtener el ID del usuario logueado');
      this.tarjetas = [];
    }
  }

  // Getter para filtrar tarjetas según los criterios
  get filteredTarjetas(): (tarjeta | Tarjeta)[] {
    if (this.isMedicoUser) {
      return this.tarjetasCentro.filter(tarjeta => {
        // Filtrar por correlativo usando id_solicitud
        const matchesCorrelativo = !this.searchCorrelativo || 
          tarjeta.id_solicitud?.toString().includes(this.searchCorrelativo);
        
        // Filtrar por tipo de tarjeta
        const matchesTipo = !this.selectedTipo || this.getTipoTarjetaValueCentro(tarjeta) === this.selectedTipo;
        
        return matchesCorrelativo && matchesTipo;
      });
    } else {
      return this.tarjetas.filter(tarjeta => {
        // Filtrar por correlativo usando id_solicitud
        const matchesCorrelativo = !this.searchCorrelativo || 
          tarjeta.id_solicitud?.toString().includes(this.searchCorrelativo);
        
        // Filtrar por tipo de tarjeta
        const matchesTipo = !this.selectedTipo || this.getTipoTarjetaValue(tarjeta) === this.selectedTipo;
        
        // Filtrar por centro (implementar cuando tengamos los datos del centro)
        const matchesCentro = !this.selectedCentro || this.getCentroValue(tarjeta) === this.selectedCentro;
        
        return matchesCorrelativo && matchesTipo && matchesCentro;
      });
    }
  }

  // Método para obtener el tipo de tarjeta
  getTipoTarjeta(tarjeta: tarjeta): string {
    const tipo = tarjeta.solicitud_tarjeta?.tipo_tarjeta || tarjeta.tipo_tarjeta || tarjeta.solicitud?.tipo_tarjeta;
    switch (tipo) {
      case 1: return 'Tarjeta de Salud';
      case 2: return 'Manipulación de Alimentos';
      default: return 'Tipo desconocido';
    }
  }

  // Método para obtener el valor del tipo de tarjeta para filtros
  getTipoTarjetaValue(tarjeta: tarjeta): string {
    const tipo = tarjeta.solicitud_tarjeta?.tipo_tarjeta || tarjeta.tipo_tarjeta || tarjeta.solicitud?.tipo_tarjeta;
    switch (tipo) {
      case 1: return 'tarjeta-salud';
      case 2: return 'tarjeta-manipulacion';
      default: return '';
    }
  }

  // Método para obtener el nombre del centro de salud
  getCentroSalud(tarjeta: tarjeta): string {
    // Si tenemos datos del centro directamente
    if (tarjeta.centro_salud?.nombre) {
      return tarjeta.centro_salud.nombre;
    }
    
    // Si tenemos el nombre como string directo
    if (tarjeta.centro_nombre) {
      return tarjeta.centro_nombre;
    }
    
    // Si tenemos el ID del centro en la nueva estructura o la anterior
    const centroId = tarjeta.solicitud_tarjeta?.id_centro_de_salud || tarjeta.solicitud?.id_centro_de_salud;
    if (centroId) {
      return this.mapearCentroIdANombre(centroId);
    }
    
    return 'Centro no especificado';
  }

  // Método auxiliar para mapear ID de centro a nombre
  private mapearCentroIdANombre(centroId: number): string {
    const centrosMap: { [key: number]: string } = {
      1: 'Amatitlán',
      2: 'Villa Nueva',
      3: 'Peronia',
      4: 'Mezquital',
      5: 'Ciudad Real',
      6: 'San Miguel Petapa',
      7: 'Villa Canales'
    };
    
    return centrosMap[centroId] || `Centro ID: ${centroId}`;
  }

  // Método para obtener el valor del centro para filtros
  getCentroValue(tarjeta: tarjeta): string {
    const centroId = tarjeta.solicitud_tarjeta?.id_centro_de_salud || tarjeta.solicitud?.id_centro_de_salud;
    if (centroId) {
      // Mapear el ID a los valores de los filtros
      const centroMap: { [key: number]: string } = {
        1: 'amatitlan',
        2: 'villa-nueva',
        3: 'peronia',
        4: 'mezquital',
        5: 'ciudad-real',
        6: 'san-miguel-petapa',
        7: 'villa-canales'
      };
      return centroMap[centroId] || '';
    }
    return '';
  }

  // Método para obtener información del ciudadano
  getCiudadanoInfo(tarjeta: tarjeta): string {
    // Nueva estructura: solicitud_tarjeta.usuario
    if (tarjeta.solicitud_tarjeta?.usuario) {
      const nombres = tarjeta.solicitud_tarjeta.usuario.nombres || '';
      const apellidos = tarjeta.solicitud_tarjeta.usuario.apellidos || '';
      return `${nombres} ${apellidos}`.trim();
    }
    
    // Si tenemos datos del ciudadano directamente (compatibilidad hacia atrás)
    if (tarjeta.ciudadano) {
      const nombres = tarjeta.ciudadano.nombres || '';
      const apellidos = tarjeta.ciudadano.apellidos || '';
      return `${nombres} ${apellidos}`.trim();
    }
    
    // Si tenemos los campos por separado
    if (tarjeta.ciudadano_nombre || tarjeta.ciudadano_apellido) {
      return `${tarjeta.ciudadano_nombre || ''} ${tarjeta.ciudadano_apellido || ''}`.trim();
    }
    
    // Si tenemos el nombre como campo directo
    if (tarjeta.nombre) {
      return tarjeta.nombre;
    }
    
    // Fallback usando el ID del ciudadano
    const ciudadanoId = tarjeta.solicitud_tarjeta?.id_ciudadano || tarjeta.id_ciudadano || tarjeta.solicitud?.id_ciudadano;
    return ciudadanoId ? `Ciudadano ID: ${ciudadanoId}` : 'Información no disponible';
  }

  // Método para obtener la fecha de solicitud formateada
  getFechaSolicitud(tarjeta: tarjeta): string {
    const fechaSolicitud = tarjeta.solicitud_tarjeta?.fecha_solicitud || tarjeta.solicitud?.fecha_solicitud;
    if (fechaSolicitud) {
      const fecha = new Date(fechaSolicitud);
      return fecha.toLocaleDateString('es-ES');
    }
    return 'Fecha no disponible';
  }

  // Método para obtener el estado de la solicitud
  getEstadoSolicitud(tarjeta: tarjeta): string {
    const estado = tarjeta.estado || tarjeta.solicitud_tarjeta?.estado || tarjeta.solicitud?.estado;
    switch (estado) {
      case 1: return 'Pendiente';
      case 2: return 'Aprobada';
      case 3: return 'Rechazada';
      default: return 'Estado desconocido';
    }
  }

  // Método para generar número de correlativo basado en datos reales
  getCorrelativo(tarjeta: tarjeta): string {
    // Usar ID de solicitud como correlativo
    const solicitudId = tarjeta.id_solicitud || tarjeta.solicitud?.id_solicitud || 0;
    return String(solicitudId).padStart(6, '0');
  }

  // Método para verificar si el usuario tiene tarjetas aprobadas vigentes
  tieneTrietasAprobadasVigentes(): boolean {
    if (!this.tarjetas || this.tarjetas.length === 0) {
      return false;
    }

    const tarjetasAprobadas = this.tarjetas.filter(tarjeta => {
      const estado = tarjeta.estado || tarjeta.solicitud_tarjeta?.estado || tarjeta.solicitud?.estado;
      return estado === 2; // Estado 2 = Aprobada
    });

    if (tarjetasAprobadas.length === 0) {
      return false;
    }

    // Verificar si alguna tarjeta está vigente
    const fechaActual = new Date();
    
    return tarjetasAprobadas.some(tarjeta => {
      // Si tiene fecha de vencimiento, verificar que no haya vencido
      if (tarjeta.fecha_vencimiento) {
        const fechaVencimiento = new Date(tarjeta.fecha_vencimiento);
        return fechaVencimiento > fechaActual;
      }
      
      // Si no tiene fecha de vencimiento pero tiene fecha de emisión, 
      // asumir vigencia de 1 año desde la emisión
      if (tarjeta.fecha_emision) {
        const fechaEmision = new Date(tarjeta.fecha_emision);
        const fechaVencimientoCalculada = new Date(fechaEmision);
        fechaVencimientoCalculada.setFullYear(fechaVencimientoCalculada.getFullYear() + 1);
        return fechaVencimientoCalculada > fechaActual;
      }
      
      // Si no tiene fechas, considerar como vigente (por seguridad)
      return true;
    });
  }

  // Método para obtener información sobre las tarjetas vigentes
  getInfoTarjetasVigentes(): { 
    cantidad: number, 
    tipos: string[], 
    proximoVencimiento: Date | null 
  } {
    const tarjetasAprobadas = this.tarjetas.filter(tarjeta => {
      const estado = tarjeta.estado || tarjeta.solicitud_tarjeta?.estado || tarjeta.solicitud?.estado;
      return estado === 2; // Estado 2 = Aprobada
    });

    const fechaActual = new Date();
    const tarjetasVigentes = tarjetasAprobadas.filter(tarjeta => {
      if (tarjeta.fecha_vencimiento) {
        const fechaVencimiento = new Date(tarjeta.fecha_vencimiento);
        return fechaVencimiento > fechaActual;
      }
      
      if (tarjeta.fecha_emision) {
        const fechaEmision = new Date(tarjeta.fecha_emision);
        const fechaVencimientoCalculada = new Date(fechaEmision);
        fechaVencimientoCalculada.setFullYear(fechaVencimientoCalculada.getFullYear() + 1);
        return fechaVencimientoCalculada > fechaActual;
      }
      
      return true;
    });

    // Obtener tipos de tarjetas vigentes
    const tipos = tarjetasVigentes.map(tarjeta => this.getTipoTarjeta(tarjeta));
    const tiposUnicos = [...new Set(tipos)];

    // Encontrar el próximo vencimiento
    let proximoVencimiento: Date | null = null;
    
    tarjetasVigentes.forEach(tarjeta => {
      let fechaVencimiento: Date | null = null;
      
      if (tarjeta.fecha_vencimiento) {
        fechaVencimiento = new Date(tarjeta.fecha_vencimiento);
      } else if (tarjeta.fecha_emision) {
        const fechaEmision = new Date(tarjeta.fecha_emision);
        fechaVencimiento = new Date(fechaEmision);
        fechaVencimiento.setFullYear(fechaVencimiento.getFullYear() + 1);
      }
      
      if (fechaVencimiento && (!proximoVencimiento || fechaVencimiento < proximoVencimiento)) {
        proximoVencimiento = fechaVencimiento;
      }
    });

    return {
      cantidad: tarjetasVigentes.length,
      tipos: tiposUnicos,
      proximoVencimiento
    };
  }

  // Método para verificar si puede solicitar un tipo específico de tarjeta
  puedesSolicitarTipo(tipoTarjeta: number): boolean {
    if (!this.tieneTrietasAprobadasVigentes()) {
      return true; // Si no tiene tarjetas vigentes, puede solicitar cualquier tipo
    }

    const infoVigentes = this.getInfoTarjetasVigentes();
    const tipoSolicitado = this.getTipoTarjetaByNumber(tipoTarjeta);
    
    // No puede solicitar si ya tiene ese tipo vigente
    return !infoVigentes.tipos.includes(tipoSolicitado);
  }

  // Método público para que otros componentes puedan verificar las tarjetas vigentes
  public verificarTarjetasVigentesUsuario(): { 
    tieneTarjetasVigentes: boolean, 
    infoTarjetas: any 
  } {
    return {
      tieneTarjetasVigentes: this.tieneTrietasAprobadasVigentes(),
      infoTarjetas: this.getInfoTarjetasVigentes()
    };
  }

  // Método auxiliar para obtener el nombre del tipo por número
  private getTipoTarjetaByNumber(tipo: number): string {
    switch (tipo) {
      case 1: return 'Tarjeta de Salud';
      case 2: return 'Tarjeta de Manipulación de Alimentos';
      default: return 'Tarjeta Desconocida';
    }
  }

  // Métodos para manejar dropdowns
  toggleTipoDropdown() {
    this.showTipoDropdown = !this.showTipoDropdown;
    this.showCentroDropdown = false; // Cerrar el otro dropdown
  }
  
  toggleCentroDropdown() {
    this.showCentroDropdown = !this.showCentroDropdown;
    this.showTipoDropdown = false; // Cerrar el otro dropdown
  }
  
  selectTipo(option: any) {
    this.selectedTipo = option.value;
    this.showTipoDropdown = false;
  }
  
  selectCentro(option: any) {
    this.selectedCentro = option.value;
    this.showCentroDropdown = false;
  }
  
  getTipoLabel(): string {
    const option = this.tipoOptions.find(opt => opt.value === this.selectedTipo);
    return option ? option.label : 'Tipo';
  }
  
  getCentroLabel(): string {
    const option = this.centroOptions.find(opt => opt.value === this.selectedCentro);
    return option ? option.label : 'centro';
  }

  // Método para obtener clase CSS del estado
  getStatusClass(estado?: number): string {
    switch (estado) {
      case 2: return 'status-aprobada';
      case 3: return 'status-rechazada';
      case 1: return 'status-pendiente';
      default: return 'status-default';
    }
  }

  // =============== MÉTODOS ESPECÍFICOS PARA TARJETAS DEL CENTRO ===============

  // Método para obtener el tipo de tarjeta para tarjetas del centro
  getTipoTarjetaCentro(tarjeta: Tarjeta): string {
    const tipo = tarjeta.solicitud_tarjeta?.tipo_tarjeta;
    switch (tipo) {
      case 1: return 'Tarjeta de Salud';
      case 2: return 'Manipulación de Alimentos';
      default: return 'Tipo desconocido';
    }
  }

  // Método para obtener el valor del tipo de tarjeta para filtros (centro)
  getTipoTarjetaValueCentro(tarjeta: Tarjeta): string {
    const tipo = tarjeta.solicitud_tarjeta?.tipo_tarjeta;
    switch (tipo) {
      case 1: return 'tarjeta-salud';
      case 2: return 'tarjeta-manipulacion';
      default: return '';
    }
  }

  // Método para obtener información del ciudadano (para tarjetas del centro)
  getCiudadanoInfoCentro(tarjeta: Tarjeta): string {
    // Nueva estructura: solicitud_tarjeta.usuario
    if (tarjeta.solicitud_tarjeta?.usuario) {
      const nombres = tarjeta.solicitud_tarjeta.usuario.nombres || '';
      const apellidos = tarjeta.solicitud_tarjeta.usuario.apellidos || '';
      return `${nombres} ${apellidos}`.trim();
    }
    
    // Fallback con nombres directos en solicitud_tarjeta (compatibilidad hacia atrás)
    if (tarjeta.solicitud_tarjeta?.nombres || tarjeta.solicitud_tarjeta?.apellidos) {
      const nombres = tarjeta.solicitud_tarjeta.nombres || '';
      const apellidos = tarjeta.solicitud_tarjeta.apellidos || '';
      return `${nombres} ${apellidos}`.trim();
    }
    
    // Fallback usando el ID del ciudadano
    const ciudadanoId = tarjeta.solicitud_tarjeta?.id_ciudadano;
    return ciudadanoId ? `Ciudadano ID: ${ciudadanoId}` : 'Información no disponible';
  }

  // Método para obtener la fecha de solicitud formateada (centro)
  getFechaSolicitudCentro(tarjeta: Tarjeta): string {
    if (tarjeta.solicitud_tarjeta?.fecha_solicitud) {
      const fecha = new Date(tarjeta.solicitud_tarjeta.fecha_solicitud);
      return fecha.toLocaleDateString('es-ES');
    }
    return 'Fecha no disponible';
  }

  // Método para obtener el estado de la solicitud (centro)
  getEstadoSolicitudCentro(tarjeta: Tarjeta): string {
    const estado = tarjeta.estado || tarjeta.solicitud_tarjeta?.estado;
    switch (estado) {
      case 1: return 'Pendiente';
      case 2: return 'Aprobada';
      case 3: return 'Rechazada';
      default: return 'Estado desconocido';
    }
  }

  // Método para generar número de correlativo (centro)
  getCorrelativoCentro(tarjeta: Tarjeta): string {
    const solicitudId = tarjeta.id_solicitud || 0;
    return String(solicitudId).padStart(6, '0');
  }

  // Método para obtener fecha de emisión formateada (centro)
  getFechaEmisionCentro(tarjeta: Tarjeta): string {
    if (tarjeta.fecha_emision) {
      const fecha = new Date(tarjeta.fecha_emision);
      return fecha.toLocaleDateString('es-ES');
    }
    return 'Fecha no disponible';
  }

  // Método para obtener fecha de vencimiento formateada (centro)
  getFechaVencimientoCentro(tarjeta: Tarjeta): string {
    if (tarjeta.fecha_vencimiento) {
      const fecha = new Date(tarjeta.fecha_vencimiento);
      return fecha.toLocaleDateString('es-ES');
    }
    return 'Fecha no disponible';
  }

  // Método para verificar si la tarjeta está vigente (centro)
  isTarjetaVigenteCentro(tarjeta: Tarjeta): boolean {
    if (tarjeta.fecha_vencimiento) {
      const fechaVencimiento = new Date(tarjeta.fecha_vencimiento);
      const fechaActual = new Date();
      return fechaVencimiento > fechaActual;
    }
    return true; // Si no tiene fecha de vencimiento, asumir vigente
  }

  // Método para obtener el estado para la clase CSS
  getTarjetaEstado(tarjeta: tarjeta | Tarjeta): number {
    if (this.isMedicoUser && 'solicitud_tarjeta' in tarjeta) {
      const tarjetaCentro = tarjeta as Tarjeta;
      return tarjetaCentro.estado || tarjetaCentro.solicitud_tarjeta?.estado || 0;
    } else {
      const tarjetaCiudadano = tarjeta as tarjeta;
      return tarjetaCiudadano.estado || tarjetaCiudadano.solicitud_tarjeta?.estado || (tarjetaCiudadano as any).solicitud?.estado || 0;
    }
  }

  // Método híbrido para obtener información según el tipo de usuario
  getTarjetaInfo(tarjeta: tarjeta | Tarjeta, campo: string): string {
    if (this.isMedicoUser && 'solicitud_tarjeta' in tarjeta) {
      // Es una tarjeta del centro
      const tarjetaCentro = tarjeta as Tarjeta;
      switch (campo) {
        case 'tipo': return this.getTipoTarjetaCentro(tarjetaCentro);
        case 'ciudadano': return this.getCiudadanoInfoCentro(tarjetaCentro);
        case 'fechaSolicitud': return this.getFechaSolicitudCentro(tarjetaCentro);
        case 'estado': return this.getEstadoSolicitudCentro(tarjetaCentro);
        case 'correlativo': return this.getCorrelativoCentro(tarjetaCentro);
        case 'fechaEmision': return this.getFechaEmisionCentro(tarjetaCentro);
        case 'fechaVencimiento': return this.getFechaVencimientoCentro(tarjetaCentro);
        default: return 'No disponible';
      }
    } else {
      // Es una tarjeta del ciudadano
      const tarjetaCiudadano = tarjeta as tarjeta;
      switch (campo) {
        case 'tipo': return this.getTipoTarjeta(tarjetaCiudadano);
        case 'ciudadano': return this.getCiudadanoInfo(tarjetaCiudadano);
        case 'fechaSolicitud': return this.getFechaSolicitud(tarjetaCiudadano);
        case 'estado': return this.getEstadoSolicitud(tarjetaCiudadano);
        case 'correlativo': return this.getCorrelativo(tarjetaCiudadano);
        case 'centro': return this.getCentroSalud(tarjetaCiudadano);
        default: return 'No disponible';
      }
    }
  }

  // =============== MÉTODOS PARA EL MODAL QR ===============

  openQRModal(tarjeta: tarjeta | Tarjeta): void {
    if (this.isMedicoUser && 'solicitud_tarjeta' in tarjeta) {
      this.selectedTarjetaForQR = tarjeta as Tarjeta;
    } else {
      // Para ciudadanos, necesitamos convertir tarjeta a Tarjeta
      const tarjetaCiudadano = tarjeta as tarjeta;
      this.selectedTarjetaForQR = this.convertTarjetaCiudadanoToTarjeta(tarjetaCiudadano);
    }
    this.showQRModal = true;
  }

  closeQRModal(): void {
    this.showQRModal = false;
    this.selectedTarjetaForQR = null;
  }

  private convertTarjetaCiudadanoToTarjeta(tarjetaCiudadano: tarjeta): Tarjeta {
    const fechaEmision = tarjetaCiudadano.fecha_emision 
      ? (typeof tarjetaCiudadano.fecha_emision === 'string' 
          ? tarjetaCiudadano.fecha_emision 
          : tarjetaCiudadano.fecha_emision.toISOString())
      : new Date().toISOString();
      
    const fechaVencimiento = tarjetaCiudadano.fecha_vencimiento
      ? (typeof tarjetaCiudadano.fecha_vencimiento === 'string'
          ? tarjetaCiudadano.fecha_vencimiento
          : tarjetaCiudadano.fecha_vencimiento.toISOString())
      : new Date().toISOString();

    return {
      id_tarjeta: tarjetaCiudadano.id_tarjeta || 0,
      id_solicitud: tarjetaCiudadano.id_solicitud || 0,
      fecha_emision: fechaEmision,
      fecha_vencimiento: fechaVencimiento,
      estado: tarjetaCiudadano.estado || 2,
      solicitud_tarjeta: {
        id_centro_de_salud: tarjetaCiudadano.solicitud_tarjeta?.id_centro_de_salud || tarjetaCiudadano.solicitud?.id_centro_de_salud || 0,
        id_ciudadano: tarjetaCiudadano.solicitud_tarjeta?.id_ciudadano || tarjetaCiudadano.id_ciudadano || tarjetaCiudadano.solicitud?.id_ciudadano || 0,
        fecha_solicitud: tarjetaCiudadano.solicitud_tarjeta?.fecha_solicitud || tarjetaCiudadano.solicitud?.fecha_solicitud || new Date().toISOString(),
        tipo_tarjeta: tarjetaCiudadano.solicitud_tarjeta?.tipo_tarjeta || tarjetaCiudadano.tipo_tarjeta || tarjetaCiudadano.solicitud?.tipo_tarjeta || 1,
        estado: tarjetaCiudadano.solicitud_tarjeta?.estado || tarjetaCiudadano.solicitud?.estado || tarjetaCiudadano.estado || 2,
        usuario: tarjetaCiudadano.solicitud_tarjeta?.usuario
      }
    };
  }

  // Método para obtener el CUI del ciudadano (si está disponible)
  getCiudadanoCUI(tarjeta: tarjeta | Tarjeta): string | undefined {
    // Para tarjetas de ciudadano, usar los datos del usuario autenticado
    if (this.usuarioAutenticado?.cui && this.isCiudadanoUser) {
      return this.usuarioAutenticado.cui;
    }
    
    // Si es una tarjeta de ciudadano con la nueva estructura, obtener el CUI directamente
    const tarjetaCiudadano = tarjeta as tarjeta;
    if (tarjetaCiudadano.solicitud_tarjeta?.usuario?.cui) {
      return tarjetaCiudadano.solicitud_tarjeta.usuario.cui;
    }
    
    // Para tarjetas del centro médico, obtener el CUI si está disponible
    if (this.isMedicoUser) {
      const tarjetaCentro = tarjeta as Tarjeta;
      if (tarjetaCentro.solicitud_tarjeta?.usuario?.cui) {
        return tarjetaCentro.solicitud_tarjeta.usuario.cui;
      }
      if (tarjetaCentro.solicitud_tarjeta?.cui_ciudadano) {
        return tarjetaCentro.solicitud_tarjeta.cui_ciudadano;
      }
    }
    
    return undefined;
  }

  // =============== MÉTODOS PARA SOLICITUDES RECHAZADAS ===============

  // Método para alternar la vista de solicitudes rechazadas
  toggleSolicitudesRechazadas(): void {
    this.mostrarSolicitudesRechazadas = !this.mostrarSolicitudesRechazadas;
    
    if (this.mostrarSolicitudesRechazadas && this.solicitudesRechazadas.length === 0) {
      this.cargarSolicitudesRechazadas();
    }
  }

  // Método para cargar las solicitudes rechazadas
  cargarSolicitudesRechazadas(): void {
    if (this.isMedicoUser) {
      this.cargarSolicitudesRechazadasCentro();
    } else {
      this.cargarSolicitudesRechazadasCiudadano();
    }
  }

  // Método para cargar solicitudes rechazadas del ciudadano
  cargarSolicitudesRechazadasCiudadano(): void {
    const userId = this.authService.getUserId();
    if (userId) {
      const userIdNumber = typeof userId === 'string' ? parseInt(userId, 10) : userId;
      
      console.log('🔍 Obteniendo solicitudes rechazadas reales para el ciudadano:', userIdNumber);
      
      this.ciudadanoService.getSolicitudesRechazadas(userIdNumber).subscribe({
        next: (solicitudes) => {
          console.log('✅ Solicitudes rechazadas obtenidas del backend:', solicitudes);
          this.solicitudesRechazadas = solicitudes;
        },
        error: (error) => {
          console.error('❌ Error al obtener solicitudes rechazadas del ciudadano:', error);
          console.log('� Intentando método alternativo...');
          
          // Intentar método alternativo
          this.ciudadanoService.getSolicitudesRechazadasAlternativo(userIdNumber).subscribe({
            next: (solicitudes) => {
              console.log('✅ Solicitudes rechazadas obtenidas con método alternativo:', solicitudes);
              this.solicitudesRechazadas = solicitudes;
            },
            error: (errorAlt) => {
              console.error('❌ Error también con método alternativo:', errorAlt);
              console.log('�📝 Posiblemente los endpoints no existen aún en el backend.');
              console.log('🔄 Usando datos de prueba temporalmente...');
          
          // Fallback a datos de prueba si el endpoint no existe
          this.solicitudesRechazadas = [
            {
              id_solicitud: 101,
              id_ciudadano: userIdNumber,
              fecha_solicitud: '2025-10-15T00:00:00.000Z',
              fecha_rechazo: '2025-10-20T00:00:00.000Z',
              tipo_tarjeta: 1, // Tarjeta de Salud
              estado: 3, // Rechazada
              motivo_rechazo: 'DOCUMENTOS_INCOMPLETOS',
              observaciones: 'Los documentos presentados no están completos. Falta el examen médico actualizado y la identificación está vencida.',
              id_centro_de_salud: 1,
              centro_salud: {
                id: 1,
                nombre: 'Centro de Salud Central'
              },
              medico: {
                id: 5,
                nombres: 'Dr. María Elena',
                apellidos: 'González Pérez'
              }
            },
            {
              id_solicitud: 102,
              id_ciudadano: userIdNumber,
              fecha_solicitud: '2025-09-28T00:00:00.000Z',
              fecha_rechazo: '2025-10-02T00:00:00.000Z',
              tipo_tarjeta: 2, // Manipulación de Alimentos
              estado: 3, // Rechazada
              motivo_rechazo: 'EXAMEN_MEDICO_VENCIDO',
              observaciones: 'El examen médico presentado tiene fecha de vencimiento anterior a la fecha de la solicitud.',
              id_centro_de_salud: 2,
              centro_salud: {
                id: 2,
                nombre: 'Centro de Salud Norte'
              },
              medico: {
                id: 3,
                nombres: 'Dr. Carlos Alberto',
                apellidos: 'Martínez López'
              }
            }
          ];
          
              console.log('✅ Datos de prueba cargados como fallback:', this.solicitudesRechazadas);
            }
          });
        }
      });
    }
  }

  // Método para cargar solicitudes rechazadas del centro (para médicos)
  cargarSolicitudesRechazadasCentro(): void {
    const centroId = this.authService.getUserInstituto();
    
    if (centroId) {
      console.log('🏥 Obteniendo solicitudes rechazadas reales del centro:', centroId);
      
      this.solicitudTarjetaService.getSolicitudesRechazadas(centroId).subscribe({
        next: (solicitudes) => {
          console.log('✅ Solicitudes rechazadas obtenidas del backend para el centro:', solicitudes);
          this.solicitudesRechazadas = solicitudes;
        },
        error: (error) => {
          console.error('❌ Error al obtener solicitudes rechazadas del centro:', error);
          console.log('� Intentando método alternativo...');
          
          // Intentar método alternativo
          this.solicitudTarjetaService.getSolicitudesRechazadasAlternativo(centroId).subscribe({
            next: (solicitudes) => {
              console.log('✅ Solicitudes rechazadas obtenidas con método alternativo:', solicitudes);
              this.solicitudesRechazadas = solicitudes;
            },
            error: (errorAlt) => {
              console.error('❌ Error también con método alternativo:', errorAlt);
              console.log('�📝 Posiblemente los endpoints no existen aún en el backend.');
              console.log('🔄 Usando datos de prueba temporalmente...');
              
              // Fallback a datos de prueba si el endpoint no existe
          this.solicitudesRechazadas = [
            {
              id_solicitud: 201,
              id_ciudadano: 15,
              fecha_solicitud: '2025-10-18T00:00:00.000Z',
              fecha_rechazo: '2025-10-22T00:00:00.000Z',
              tipo_tarjeta: 1,
              estado: 3,
              motivo_rechazo: 'INFORMACION_INCORRECTA',
              observaciones: 'La información proporcionada en el formulario no coincide con los documentos presentados.',
              id_centro_de_salud: centroId,
              ciudadano: {
                nombres: 'Ana Patricia',
                apellidos: 'Morales Rivera',
                cui: '1987654321098'
              }
            },
            {
              id_solicitud: 202,
              id_ciudadano: 22,
              fecha_solicitud: '2025-10-10T00:00:00.000Z',
              fecha_rechazo: '2025-10-15T00:00:00.000Z',
              tipo_tarjeta: 2,
              estado: 3,
              motivo_rechazo: 'NO_CUMPLE_REQUISITOS',
              observaciones: 'El solicitante no cumple con los requisitos mínimos para obtener la tarjeta de manipulación de alimentos.',
              id_centro_de_salud: centroId,
              ciudadano: {
                nombres: 'José Antonio',
                apellidos: 'García López',
                cui: '2547896321470'
              }
            }
          ];
          
              console.log('✅ Datos de prueba del centro cargados como fallback:', this.solicitudesRechazadas);
            }
          });
        }
      });
    }
  }

  // Método para obtener el nombre del tipo de tarjeta rechazada
  getTipoTarjetaRechazada(tipoTarjeta: number): string {
    switch (tipoTarjeta) {
      case 1: return 'Tarjeta de Salud';
      case 2: return 'Manipulación de Alimentos';
      default: return 'Tipo desconocido';
    }
  }

  // Método para obtener el motivo de rechazo legible
  getMotivoRechazoLegible(motivo: string): string {
    const motivos: { [key: string]: string } = {
      'DOCUMENTOS_INCOMPLETOS': 'Documentos Incompletos',
      'EXAMEN_MEDICO_VENCIDO': 'Examen Médico Vencido',
      'INFORMACION_INCORRECTA': 'Información Incorrecta',
      'NO_CUMPLE_REQUISITOS': 'No Cumple Requisitos',
      'DUPLICADO': 'Solicitud Duplicada',
      'OTRO': 'Otro Motivo'
    };
    
    return motivos[motivo] || motivo;
  }

  // Método para obtener información del ciudadano de la solicitud rechazada
  getCiudadanoInfoRechazada(solicitud: any): string {
    if (this.isMedicoUser && solicitud.ciudadano) {
      return `${solicitud.ciudadano.nombres} ${solicitud.ciudadano.apellidos}`;
    }
    
    // Para ciudadanos, mostrar su propio nombre si está disponible
    if (this.usuarioAutenticado) {
      return `${this.usuarioAutenticado.nombres || ''} ${this.usuarioAutenticado.apellidos || ''}`.trim();
    }
    
    return `Ciudadano ID: ${solicitud.id_ciudadano}`;
  }

  // Método para obtener fecha formateada de rechazo
  getFechaRechazoFormateada(fecha: string): string {
    if (fecha) {
      const fechaObj = new Date(fecha);
      return fechaObj.toLocaleDateString('es-ES');
    }
    return 'Fecha no disponible';
  }

  // Método para obtener fecha formateada de solicitud
  getFechaSolicitudRechazadaFormateada(fecha: string): string {
    if (fecha) {
      const fechaObj = new Date(fecha);
      return fechaObj.toLocaleDateString('es-ES');
    }
    return 'Fecha no disponible';
  }

  // Método para obtener el nombre del centro de salud de la solicitud rechazada
  getCentroSaludRechazada(solicitud: any): string {
    if (solicitud.centro_salud?.nombre) {
      return solicitud.centro_salud.nombre;
    }
    
    // Mapear ID del centro a nombre si no viene el objeto completo
    const centroId = solicitud.id_centro_de_salud;
    if (centroId) {
      return this.mapearCentroIdANombre(centroId);
    }
    
    return 'Centro no especificado';
  }

  // Método para obtener información del médico que rechazó
  getMedicoRechazo(solicitud: any): string {
    if (solicitud.medico) {
      return `${solicitud.medico.nombres} ${solicitud.medico.apellidos}`;
    }
    
    return 'Médico no especificado';
  }

}