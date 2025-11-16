import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Tarjeta, EstadoTarjeta, TipoTarjeta } from '../../../interfaces/tarjeta';
import { Instituto } from '../../../interfaces/instituto';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-listado-tarjetas',
  imports: [CommonModule, FormsModule],
  templateUrl: './listado-tarjetas.component.html',
  styleUrl: './listado-tarjetas.component.css'
})
export class ListadoTarjetasComponent implements OnInit {
  tarjetas: Tarjeta[] = [];
  centrosSalud: Instituto[] = [];
  loading = false;
  error: string | null = null;
  
  // Filtros
  filtroNombre = '';
  filtroCUI = '';
  filtroEstado: number | null = null;
  filtroTipo: number | null = null;
  filtroCentro: number | null = null;
  
  // API URLs
  private apiUrl = `${environment.apiUrl}/tarjeta`;
  private apiInstitutoUrl = `${environment.apiUrl}/instituto`;
  
  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.cargarTarjetas();
    this.cargarCentrosSalud();
  }

  /**
   * Cargar tarjetas desde el backend
   */
  cargarTarjetas(): void {
    this.loading = true;
    this.error = null;
    
    console.log('📡 Cargando tarjetas desde:', this.apiUrl);
    
    this.http.get<Tarjeta[]>(this.apiUrl).subscribe({
      next: (response) => {
        console.log('✅ Tarjetas cargadas:', response);
        this.tarjetas = response || [];
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        console.error('❌ Error al cargar tarjetas:', error);
        
        if (error.status === 0) {
          this.error = 'No se puede conectar con el servidor.';
        } else if (error.status === 401) {
          this.error = 'No autorizado. Tu sesión puede haber expirado.';
        } else if (error.status === 403) {
          this.error = 'No tienes permisos para ver las tarjetas.';
        } else if (error.status >= 500) {
          this.error = 'Error del servidor. Inténtalo más tarde.';
        } else {
          this.error = 'Error inesperado al cargar las tarjetas.';
        }
      }
    });
  }

  /**
   * Carga los centros de salud desde la API
   */
  cargarCentrosSalud(): void {
    this.http.get<Instituto[]>(this.apiInstitutoUrl).subscribe({
      next: (response) => {
        this.centrosSalud = response || [];
      },
      error: (error) => {
        console.error('❌ Error al cargar centros de salud:', error);
      }
    });
  }

  /**
   * Getter para tarjetas filtradas
   */
  get tarjetasFiltradas(): Tarjeta[] {
    if (!this.filtroNombre.trim() && 
        !this.filtroCUI.trim() && 
        this.filtroEstado === null && 
        this.filtroTipo === null &&
        this.filtroCentro === null) {
      return this.tarjetas;
    }

    return this.tarjetas.filter(tarjeta => {
      const usuario = tarjeta.solicitud_tarjeta.usuario;
      const nombreCompleto = `${usuario?.nombres || ''} ${usuario?.apellidos || ''}`.toLowerCase();
      const cui = usuario?.cui || '';
      
      const matchNombre = !this.filtroNombre.trim() || 
                         nombreCompleto.includes(this.filtroNombre.toLowerCase());
      
      const matchCUI = !this.filtroCUI.trim() || 
                      cui.includes(this.filtroCUI);
      
      const matchEstado = this.filtroEstado === null || 
                         tarjeta.estado === this.filtroEstado;
      
      const matchTipo = this.filtroTipo === null || 
                       tarjeta.solicitud_tarjeta.tipo_tarjeta === this.filtroTipo;
      
      const matchCentro = this.filtroCentro === null ||
                         tarjeta.solicitud_tarjeta.id_centro_de_salud === this.filtroCentro;
      
      return matchNombre && matchCUI && matchEstado && matchTipo && matchCentro;
    });
  }

  /**
   * Limpiar filtros
   */
  limpiarFiltros(): void {
    this.filtroNombre = '';
    this.filtroCUI = '';
    this.filtroEstado = null;
    this.filtroTipo = null;
    this.filtroCentro = null;
  }

  /**
   * Recargar lista de tarjetas
   */
  recargar(): void {
    this.cargarTarjetas();
  }

  /**
   * Obtener nombre del estado
   */
  obtenerNombreEstado(estado: number): string {
    switch (estado) {
      case EstadoTarjeta.PENDIENTE: return 'Pendiente';
      case EstadoTarjeta.APROBADA: return 'Aprobada';
      case EstadoTarjeta.VENCIDA: return 'Vencida';
      case EstadoTarjeta.CANCELADA: return 'Cancelada';
      default: return 'Desconocido';
    }
  }

  /**
   * Obtener nombre del tipo de tarjeta
   */
  obtenerNombreTipo(tipo: number): string {
    switch (tipo) {
      case TipoTarjeta.SALUD: return 'Salud';
      case TipoTarjeta.MANIPULACION: return 'Manipulación';
      default: return 'Desconocido';
    }
  }

  /**
   * Formatear fecha
   */
  formatearFecha(fecha: string): string {
    try {
      const date = new Date(fecha);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch {
      return 'Fecha inválida';
    }
  }

  /**
   * Verificar si la tarjeta está vencida
   */
  estaVencida(tarjeta: Tarjeta): boolean {
    const fechaVencimiento = new Date(tarjeta.fecha_vencimiento);
    const fechaActual = new Date();
    return fechaVencimiento < fechaActual;
  }

  /**
   * Verificar si la tarjeta vence pronto (en 30 días)
   */
  vencePronto(tarjeta: Tarjeta): boolean {
    const fechaVencimiento = new Date(tarjeta.fecha_vencimiento);
    const fechaActual = new Date();
    const diferenciaDias = Math.ceil((fechaVencimiento.getTime() - fechaActual.getTime()) / (1000 * 3600 * 24));
    return diferenciaDias > 0 && diferenciaDias <= 30;
  }
}
