import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateUsuarioDto, Usuario, UpdateUsuarioDto } from '../interfaces/usuario';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private apiUrl = 'http://localhost:3000'; // URL base del backend

  constructor(private http: HttpClient) { }

  // Crear nuevo usuario
  crearUsuario(usuario: CreateUsuarioDto): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.apiUrl}/usuarios`, usuario);
  }

  // Obtener todos los usuarios
  getUsuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.apiUrl}/usuarios`);
  }

  // Obtener usuario por ID
  getUsuarioById(id: number): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.apiUrl}/usuarios/${id}`);
  }

  // Actualizar usuario
  actualizarUsuario(id: number, usuario: UpdateUsuarioDto): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.apiUrl}/usuarios/${id}`, usuario);
  }

  // Eliminar usuario (desactivar)
  eliminarUsuario(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/usuarios/${id}`);
  }

  // Nota: La validación de CUI y email duplicados se maneja en el backend al crear el usuario

  // Obtener usuarios por rol
  getUsuariosByRol(rol: number): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.apiUrl}/usuarios/rol/${rol}`);
  }

  // Cambiar estado del usuario
  cambiarEstadoUsuario(id: number, estado: number): Observable<Usuario> {
    return this.http.patch<Usuario>(`${this.apiUrl}/usuarios/${id}/estado`, { estado });
  }

  // Resetear password
  resetearPassword(id: number, nuevaPassword: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/usuarios/${id}/password`, { password: nuevaPassword });
  }
}