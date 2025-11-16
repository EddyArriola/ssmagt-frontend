import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { switchMap, catchError, map } from 'rxjs/operators';
import { CreateSolicitudTarjetaDto, SolicitudTarjetaResponse, CentroDeSalud, SolicitudPendiente, UpdateSolicitudTarjetaDto } from '../interfaces/solicitud-tarjeta';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SolicitudTarjetaService {
  private myAppUrl: string;
  private myApiUrl: string;

  // Lista de centros de salud disponibles
  private centrosDeSalud: CentroDeSalud[] = [
    { id: 1, nombre: "Centro de Salud Amatitlán" },
    { id: 2, nombre: "Centro de salud Villa Nueva" },
    { id: 3, nombre: "Centro de salud Peronia" },
    { id: 4, nombre: "Centro de salud Mezquital" },
    { id: 5, nombre: "Centro de salud Ciudad Real" },
    { id: 6, nombre: "Centro de salud San Miguel Petapa" },
    { id: 7, nombre: "Centro de salud Villa Canales" }
  ];

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    this.myAppUrl = `${environment.apiUrl}/`;
    this.myApiUrl = 'solicitud-tarjeta';
  }

  /**
   * Método auxiliar para generar información de debug sobre problemas del backend
   */
  private generarInfoDebugBackend(error: any, operacion: string): string {
    let infoDebug = `\n🔍 INFORMACIÓN DE DEBUG PARA EL BACKEND:\n`;
    infoDebug += `Operación: ${operacion}\n`;
    infoDebug += `Timestamp: ${new Date().toISOString()}\n\n`;
    
    if (error.error) {
      infoDebug += `Error del servidor:\n${JSON.stringify(error.error, null, 2)}\n\n`;
    }
    
    infoDebug += `📋 POSIBLES SOLUCIONES PARA EL BACKEND:\n`;
    infoDebug += `1. Verificar el esquema de Prisma para la tabla 'tarjeta'\n`;
    infoDebug += `2. El campo 'id_solicitud' no existe, probablemente la relación debe ser:\n`;
    infoDebug += `   - Usar 'solicitud_tarjeta' como relación en lugar de 'id_solicitud'\n`;
    infoDebug += `3. Revisar las migraciones de la base de datos\n`;
    infoDebug += `4. Verificar que la relación tarjeta-solicitud esté correctamente definida\n\n`;
    
    return infoDebug;
  }

  /**
   * Crear una nueva solicitud de tarjeta
   * @param solicitudData - Datos de la solicitud
   * @returns Observable con la respuesta del servidor
   */
  crearSolicitudTarjeta(solicitudData: CreateSolicitudTarjetaDto): Observable<SolicitudTarjetaResponse> {
    const url = this.myAppUrl + this.myApiUrl;
    console.log('URL de solicitud:', url);
    console.log('Datos a enviar:', solicitudData);
    return this.http.post<SolicitudTarjetaResponse>(url, solicitudData);
  }

  /**
   * Obtener solicitudes pendientes por centro de salud
   * @param idCentro - ID del centro de salud
   * @returns Observable con las solicitudes pendientes
   */
  getSolicitudesPendientes(idCentro: number): Observable<SolicitudPendiente[]> {
    const url = `${this.myAppUrl}${this.myApiUrl}/pendientes/centro/${idCentro}`;
    console.log('URL para obtener solicitudes pendientes:', url);
    return this.http.get<SolicitudPendiente[]>(url);
  }

  /**
   * Obtener datos de un usuario por ID
   * @param userId - ID del usuario
   * @returns Observable con los datos del usuario
   */
  getUsuarioById(userId: number): Observable<any> {
    const url = `${this.myAppUrl}usuarios/${userId}`;
    console.log('URL para obtener usuario:', url);
    return this.http.get<any>(url);
  }

  /**
   * Obtener una solicitud específica por ID
   * @param idSolicitud - ID de la solicitud
   * @returns Observable con los datos de la solicitud
   */
  getSolicitudById(idSolicitud: number): Observable<any> {
    // Intentar primero con el endpoint específico, si no existe usar el general
    const url = `${this.myAppUrl}${this.myApiUrl}/${idSolicitud}`;
    console.log('🔍 URL para obtener solicitud específica:', url);
    return this.http.get<any>(url);
  }

  /**
   * Aprobar una solicitud de tarjeta
   * IMPORTANTE: Cuando se aprueba una solicitud (estado=2), el backend automáticamente
   * intenta crear una tarjeta asociada. Si hay errores de "tarjeta.create", esto indica
   * un problema en el esquema de la base de datos del backend (relación tarjeta-solicitud).
   * 
   * @param idSolicitud - ID de la solicitud
   * @returns Observable con la respuesta del servidor
   */
  aprobarSolicitud(idSolicitud: number): Observable<any> {
    const idMedico = this.authService.getUserId();
    
    if (!idMedico) {
      throw new Error('No se pudo obtener el ID del médico logueado');
    }

    console.log('🔍 Obteniendo solicitud completa para aprobar:', idSolicitud);
    console.log('👨‍⚕️ ID del médico logueado:', idMedico);

    // Primero obtener la solicitud completa, luego actualizarla
    return this.getSolicitudById(idSolicitud).pipe(
      switchMap(solicitudCompleta => {
        console.log('📋 Solicitud obtenida:', solicitudCompleta);
        
        // Actualizar solo los campos necesarios manteniendo toda la estructura
        const solicitudActualizada = {
          ...solicitudCompleta,
          estado: 2, // 2 = Aprobado
          id_medico: Number(idMedico) // ID del médico que aprueba
        };
        
        console.log('📤 Datos completos a enviar para aprobación:', solicitudActualizada);
        console.log('🔍 Estructura de campos enviados:', Object.keys(solicitudActualizada));
        console.log('⚠️ IMPORTANTE: Al aprobar (estado=2), el backend intentará crear una tarjeta automáticamente');
        
        const url = `${this.myAppUrl}${this.myApiUrl}/${idSolicitud}`;
        return this.http.put<any>(url, solicitudActualizada);
      }),
      catchError(error => {
        console.error('❌ Error al aprobar solicitud:', error);
        
        // Verificar si es el error específico de creación de tarjeta
        if (error.error && error.error.message && 
            (error.error.message.includes('tarjeta.create') || 
             error.error.message.includes('Unknown argument `id_solicitud`'))) {
          
          const infoDebug = this.generarInfoDebugBackend(error, 'Aprobar Solicitud');
          console.error(infoDebug);
          
          const mensajeError = '⚠️ Error del backend: Problema al crear la tarjeta automáticamente. ' +
                              'El esquema de la base de datos tiene un problema con la relación tarjeta-solicitud. ' +
                              'Revise la consola para más detalles técnicos.';
          
          return throwError(() => new Error(mensajeError));
        }
        
        return throwError(() => error);
      })
    );
  }

  /**
   * Rechazar una solicitud de tarjeta
   * @param idSolicitud - ID de la solicitud
   * @param motivoRechazo - Motivo del rechazo (opcional)
   * @returns Observable con la respuesta del servidor
   */
  rechazarSolicitud(idSolicitud: number, motivoRechazo?: string): Observable<any> {
    const idMedico = this.authService.getUserId();
    
    if (!idMedico) {
      throw new Error('No se pudo obtener el ID del médico logueado');
    }

    console.log('🔍 Obteniendo solicitud completa para rechazar:', idSolicitud);
    console.log('👨‍⚕️ ID del médico logueado:', idMedico);
    console.log('📝 Motivo de rechazo:', motivoRechazo);

    // Primero obtener la solicitud completa, luego actualizarla
    return this.getSolicitudById(idSolicitud).pipe(
      switchMap(solicitudCompleta => {
        console.log('📋 Solicitud obtenida:', solicitudCompleta);
        
        // Actualizar solo los campos necesarios manteniendo toda la estructura
        const solicitudActualizada = {
          ...solicitudCompleta,
          estado: 3, // 3 = Rechazado
          id_medico: Number(idMedico), // ID del médico que rechaza
          observaciones: motivoRechazo || solicitudCompleta.observaciones || '' // Mantener observaciones existentes si no hay motivo
        };
        
        console.log('📤 Datos completos a enviar para rechazo:', solicitudActualizada);
        console.log('🔍 Estructura de campos enviados:', Object.keys(solicitudActualizada));
        
        const url = `${this.myAppUrl}${this.myApiUrl}/${idSolicitud}`;
        return this.http.put<any>(url, solicitudActualizada);
      })
    );
  }

  /**
   * Obtener la lista de centros de salud disponibles
   * @returns Array de centros de salud
   */
  getCentrosDeSalud(): CentroDeSalud[] {
    return this.centrosDeSalud;
  }

  /**
   * Obtener un centro de salud por ID
   * @param id - ID del centro de salud
   * @returns Centro de salud o undefined si no existe
   */
  getCentroDeSaludById(id: number): CentroDeSalud | undefined {
    return this.centrosDeSalud.find(centro => centro.id === id);
  }

  /**
   * Crear objeto de solicitud para tarjeta de salud
   * @param ciudadanoId - ID del ciudadano
   * @param centroSaludId - ID del centro de salud
   * @param examenMedico - URL del archivo de examen subido
   * @param observaciones - Observaciones adicionales (opcional)
   * @returns Objeto CreateSolicitudTarjetaDto configurado
   */
  crearSolicitudSalud(
    ciudadanoId: number, 
    centroSaludId: number, 
    examenMedico: string, 
    observaciones?: string
  ): CreateSolicitudTarjetaDto {
    return {
      id_ciudadano: ciudadanoId,
      id_centro_de_salud: centroSaludId,
      tipo_tarjeta: 1, // 1 = tarjeta de salud
      observaciones: observaciones || '',
      examen_medico: examenMedico
    };
  }

  /**
   * Crear objeto de solicitud para tarjeta de alimentos
   * @param ciudadanoId - ID del ciudadano
   * @param centroSaludId - ID del centro de salud
   * @param observaciones - Observaciones adicionales (opcional)
   * @returns Objeto CreateSolicitudTarjetaDto configurado
   */
  crearSolicitudAlimentos(
    ciudadanoId: number, 
    centroSaludId: number, 
    observaciones?: string
  ): CreateSolicitudTarjetaDto {
    return {
      id_ciudadano: ciudadanoId,
      id_centro_de_salud: centroSaludId,
      tipo_tarjeta: 2, // 2 = tarjeta de alimentos
      observaciones: observaciones || ''
    };
  }

  /**
   * Obtener solicitudes rechazadas por centro de salud
   * @param idCentro - ID del centro de salud
   * @returns Observable con las solicitudes rechazadas
   */
  getSolicitudesRechazadas(idCentro: number): Observable<any[]> {
    const url = `${this.myAppUrl}${this.myApiUrl}/rechazadas/centro/${idCentro}`;
    console.log('🔍 URL para obtener solicitudes rechazadas del centro:', url);
    console.log('📋 INFORMACIÓN PARA EL BACKEND:');
    console.log('   - Endpoint esperado:', url);
    console.log('   - Método HTTP: GET');
    console.log('   - Descripción: Obtener solicitudes con estado=3 (rechazadas) para el centro específico');
    console.log('   - Respuesta esperada: Array de objetos con las solicitudes rechazadas');
    console.log('   - Campos necesarios: id_solicitud, tipo_tarjeta, fecha_solicitud, observaciones, motivo_rechazo, datos del ciudadano, etc.');
    console.log('   - Query SQL sugerido: SELECT * FROM solicitud_tarjeta WHERE estado=3 AND id_centro_de_salud=${idCentro}');
    
    return this.http.get<any[]>(url);
  }

  /**
   * Método alternativo: Obtener todas las solicitudes del centro y filtrar las rechazadas
   * @param idCentro - ID del centro de salud
   * @returns Observable con las solicitudes rechazadas filtradas
   */
  getSolicitudesRechazadasAlternativo(idCentro: number): Observable<any[]> {
    const url = `${this.myAppUrl}${this.myApiUrl}/centro/${idCentro}`;
    console.log('🔄 URL alternativa para obtener todas las solicitudes del centro:', url);
    console.log('📝 Nota: Se filtrarán las solicitudes rechazadas (estado=3) en el frontend');
    
    return this.http.get<any[]>(url).pipe(
      map((solicitudes: any[]) => {
        return solicitudes.filter((solicitud: any) => solicitud.estado === 3);
      }),
      catchError((error: any) => {
        console.warn('⚠️ Endpoint alternativo tampoco disponible, probando con solicitudes pendientes...');
        // Intentar también con el endpoint de pendientes pero filtrar por estado
        return this.getSolicitudesPendientes(idCentro).pipe(
          map((solicitudes: any[]) => {
            return solicitudes.filter((solicitud: any) => solicitud.estado === 3);
          })
        );
      })
    );
  }

  /**
   * Validar datos de solicitud antes de enviar
   * @param solicitud - Datos de la solicitud
   * @returns Array de errores de validación (vacío si es válida)
   */
  validarSolicitud(solicitud: CreateSolicitudTarjetaDto): string[] {
    const errores: string[] = [];

    if (!solicitud.id_ciudadano) {
      errores.push('ID de ciudadano es requerido');
    }

    if (!solicitud.id_centro_de_salud) {
      errores.push('Centro de salud es requerido');
    }

    if (!solicitud.tipo_tarjeta) {
      errores.push('Tipo de tarjeta es requerido');
    }

    if (solicitud.tipo_tarjeta === 1 && !solicitud.examen_medico) {
      errores.push('Para tarjeta de salud se requiere subir el examen médico');
    }

    return errores;
  }
}