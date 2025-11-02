import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { Observable, BehaviorSubject } from 'rxjs';
import { roleName } from '../models/role';

interface DecodedToken {
  sub?: string | number;
  exp?: number;
  iat?: number;
  roles?: string[] | string | number[] | number;
  role?: string | number;
  [k: string]: any;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private url = 'http://localhost:3000/auth/login';

  private currentUserSubject = new BehaviorSubject<DecodedToken | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  // ahora usamos roleName() para normalizar roles numéricos a etiquetas definidas en `models/role.ts`

  constructor(private http: HttpClient, private router: Router) {
    this.restoreFromStorage();
  }

  /**
   * Llama al backend y guarda el token en localStorage. Además emite el usuario decodificado.
   */
  login(cui: string, password: string): Observable<{ access_token?: string; token?: string; [k: string]: any }> {
    return this.http.post<{ access_token?: string; token?: string; [k: string]: any }>(this.url, { cui, password }).pipe(
      tap((res) => {
        // Log temporal para depuración (quitar en producción)
        console.log('AuthService.login response:', res);

        const token = res?.access_token ?? res?.token;
        if (token) {
          localStorage.setItem('auth_token', token);
          const decoded = this.decodeToken(token);
          this.currentUserSubject.next(decoded);
        }
      })
    );
  }

  logout() {
    localStorage.removeItem('auth_token');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  /**
   * Decodifica el JWT sin verificar la firma (útil en frontend).
   */
  decodeToken(token: string): DecodedToken | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const json = decodeURIComponent(atob(payload).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(json) as DecodedToken;
    } catch (e) {
      console.warn('decodeToken failed', e);
      return null;
    }
  }

  /**
   * Devuelve el rol principal del usuario (si existe). Maneja 'role' o 'roles' en el token.
   */
  /**
   * Devuelve el rol tal como viene en el token (puede ser string o número, o array de ambos).
   */
  getUserRole(): string | number | Array<string | number> | null {
    const decoded = this.currentUserSubject.value ?? (this.getToken() ? this.decodeToken(this.getToken() as string) : null);
    if (!decoded) return null;
    if (decoded.role !== undefined && decoded.role !== null) return decoded.role as string | number;
    if (decoded.roles !== undefined && decoded.roles !== null) return decoded.roles as Array<string | number> | string | number;
    return null;
  }

  /**
   * Normaliza el rol devolviendo siempre un string o array de strings usando `roleMap`.
   * Ej: si token contiene 1, devolverá 'admin'. Si contiene ['1','2'] devolverá ['admin','manager'].
   */
  getNormalizedRole(): string | string[] | null {
    const raw = this.getUserRole();
    if (!raw) return null;

    const mapValue = (r: string | number): string | null => {
      const mapped = roleName(r as any);
      if (mapped) return mapped;
      return String(r || '').toLowerCase() || null;
    };

    if (Array.isArray(raw)) {
      const mapped = raw.map(mapValue).filter(Boolean) as string[];
      return mapped.length ? mapped : null;
    }

    return mapValue(raw) ?? null;
  }

  /**
   * Obtiene el ID del usuario logueado desde el token (campo sub o id).
   */
  getUserId(): string | number | null {
    const decoded = this.currentUserSubject.value ?? (this.getToken() ? this.decodeToken(this.getToken() as string) : null);
    if (!decoded) return null;
    return decoded.sub ?? decoded['id'] ?? null;
  }

  /**
   * Obtiene el ID del instituto/centro de salud del usuario logueado desde el token.
   */
  getUserInstituto(): number | null {
    const decoded = this.currentUserSubject.value ?? (this.getToken() ? this.decodeToken(this.getToken() as string) : null);
    if (!decoded) return null;
    
    const instituto = decoded['instituto'] ?? decoded['id_centro'] ?? decoded['centro_id'] ?? decoded['id_centro_de_salud'] ?? decoded['centro'];
    
    // Log para depuración
    if (instituto === null || instituto === undefined) {
      console.warn('⚠️ Usuario sin instituto asignado. Verificar en backend:', {
        userId: decoded['id'] || decoded.sub,
        role: decoded.roles || decoded.role,
        availableFields: Object.keys(decoded)
      });
    }
    
    return instituto ? Number(instituto) : null;
  }

  /**
   * Restaurar estado desde localStorage al iniciar el servicio.
   */
  private restoreFromStorage() {
    const token = this.getToken();
    if (token) {
      const decoded = this.decodeToken(token);
      this.currentUserSubject.next(decoded);
    }
  }
}
