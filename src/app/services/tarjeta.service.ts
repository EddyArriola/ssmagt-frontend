 import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Tarjeta, TarjetasCentroResponse } from '../interfaces/tarjeta';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TarjetaService {
  private apiUrl = environment.apiUrl; // URL base del backend

  constructor(private http: HttpClient) { }

  // Obtener todas las tarjetas de un centro de salud
  getTarjetasPorCentro(idCentro: number): Observable<Tarjeta[]> {
    return this.http.get<Tarjeta[]>(`${this.apiUrl}/tarjeta/centro/${idCentro}`);
  }

  // Obtener tarjeta por ID
  getTarjetaById(id: number): Observable<Tarjeta> {
    return this.http.get<Tarjeta>(`${this.apiUrl}/tarjeta/${id}`);
  }

  // Obtener tarjetas por ciudadano
  getTarjetasPorCiudadano(idCiudadano: number): Observable<Tarjeta[]> {
    return this.http.get<Tarjeta[]>(`${this.apiUrl}/tarjeta/ciudadano/${idCiudadano}`);
  }

  // Actualizar estado de tarjeta
  actualizarEstadoTarjeta(id: number, estado: number): Observable<Tarjeta> {
    return this.http.patch<Tarjeta>(`${this.apiUrl}/tarjeta/${id}/estado`, { estado });
  }

  // Obtener estadísticas de tarjetas por centro
  getEstadisticasPorCentro(idCentro: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/tarjeta/centro/${idCentro}/estadisticas`);
  }
}