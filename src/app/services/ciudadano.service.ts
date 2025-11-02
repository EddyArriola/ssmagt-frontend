import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, forkJoin, throwError } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { tarjeta } from '../interfaces/tarjetas';

@Injectable({
  providedIn: 'root'
})
export class CiudadanoService {
  private myAppUrl: string;
  private myApiUrl: string;
  
  constructor(private http: HttpClient) {
    this.myAppUrl = 'http://localhost:3000/';
    this.myApiUrl = 'tarjeta/usuario/';
  }

  /**
   * Obtener tarjetas básicas del usuario
   * @param id - ID del ciudadano
   * @returns Observable con las tarjetas básicas
   */
  getTarjetas(id: number): Observable<tarjeta[]> {
    return this.http.get<tarjeta[]>(this.myAppUrl + this.myApiUrl + id);
  }

  /**
   * Obtener tarjetas con información detallada de solicitudes
   * @param id - ID del ciudadano
   * @returns Observable con tarjetas enriquecidas con datos de solicitudes
   */
  getTarjetasConDetalles(id: number): Observable<tarjeta[]> {
    return this.getTarjetas(id).pipe(
      switchMap(tarjetas => {
        if (!tarjetas || tarjetas.length === 0) {
          return new Observable<tarjeta[]>(observer => {
            observer.next([]);
            observer.complete();
          });
        }

        // Obtener IDs únicos de solicitudes
        const solicitudIds = [...new Set(
          tarjetas
            .map(t => t.id_solicitud)
            .filter(id => id !== undefined && id !== null)
        )] as number[];

        if (solicitudIds.length === 0) {
          return new Observable<tarjeta[]>(observer => {
            observer.next(tarjetas);
            observer.complete();
          });
        }

        // Crear array de observables para obtener datos de cada solicitud
        const solicitudesObservables = solicitudIds.map(solicitudId => 
          this.getSolicitudById(solicitudId)
        );

        // Ejecutar todas las llamadas en paralelo
        return forkJoin(solicitudesObservables).pipe(
          map(solicitudes => {
            // Crear mapa para acceso rápido
            const solicitudesMap = new Map();
            solicitudIds.forEach((id, index) => {
              solicitudesMap.set(id, solicitudes[index]);
            });

            // Enriquecer tarjetas con datos de solicitudes
            return tarjetas.map(tarjeta => ({
              ...tarjeta,
              solicitud: tarjeta.id_solicitud ? solicitudesMap.get(tarjeta.id_solicitud) : null,
              // Agregar campos de acceso rápido
              id_ciudadano: tarjeta.id_solicitud ? solicitudesMap.get(tarjeta.id_solicitud)?.id_ciudadano : null,
              tipo_tarjeta: tarjeta.id_solicitud ? solicitudesMap.get(tarjeta.id_solicitud)?.tipo_tarjeta : null
            })) as tarjeta[];
          })
        );
      })
    );
  }

  /**
   * Obtener una solicitud por ID
   * @param solicitudId - ID de la solicitud
   * @returns Observable con los datos de la solicitud
   */
  getSolicitudById(solicitudId: number): Observable<any> {
    const url = `${this.myAppUrl}solicitud-tarjeta/${solicitudId}`;
    console.log('URL para obtener solicitud:', url);
    return this.http.get<any>(url);
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
   * Obtener datos de un centro de salud por ID
   * @param centroId - ID del centro de salud
   * @returns Observable con los datos del centro
   */
  getCentroSaludById(centroId: number): Observable<any> {
    const url = `${this.myAppUrl}centros-salud/${centroId}`;
    console.log('URL para obtener centro de salud:', url);
    return this.http.get<any>(url);
  }

  /**
   * Obtener solicitudes rechazadas de un ciudadano
   * @param ciudadanoId - ID del ciudadano
   * @returns Observable con las solicitudes rechazadas
   */
  getSolicitudesRechazadas(ciudadanoId: number): Observable<any[]> {
    const url = `${this.myAppUrl}solicitud-tarjeta/usuario/${ciudadanoId}`;
    console.log('🔍 URL para obtener todas las solicitudes del ciudadano:', url);
    console.log('📋 Filtrando solicitudes rechazadas (estado=3) en el frontend');
    
    return this.http.get<any[]>(url).pipe(
      map((solicitudes: any[]) => {
        console.log('✅ Solicitudes obtenidas del backend:', solicitudes);
        const solicitudesRechazadas = solicitudes.filter((solicitud: any) => solicitud.estado === 3);
        console.log('🔄 Solicitudes rechazadas filtradas:', solicitudesRechazadas);
        return solicitudesRechazadas;
      }),
      catchError((error: any) => {
        console.error('❌ Error al obtener solicitudes del usuario:', error);
        throw error;
      })
    );
  }

  /**
   * Método alternativo: Obtener solicitudes rechazadas usando datos de prueba como fallback
   * @param ciudadanoId - ID del ciudadano
   * @returns Observable con solicitudes rechazadas de prueba
   */
  getSolicitudesRechazadasAlternativo(ciudadanoId: number): Observable<any[]> {
    console.log('🔄 Método alternativo: Generando datos de prueba para solicitudes rechazadas');
    console.log('� Este método se usa como fallback cuando el endpoint principal no funciona');
    
    // Crear datos de prueba como fallback
    const solicitudesRechazadasPrueba = [
      {
        id_solicitud: 101,
        id_ciudadano: ciudadanoId,
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
        id_ciudadano: ciudadanoId,
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
    
    return new Observable<any[]>(observer => {
      observer.next(solicitudesRechazadasPrueba);
      observer.complete();
    });
  }

}
