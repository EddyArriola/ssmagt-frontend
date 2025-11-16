import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { Observable, BehaviorSubject } from 'rxjs';
import { roleName } from '../models/role';
import { MultiSessionService } from './multi-session.service';
import { environment } from '../../environments/environment';

interface DecodedToken {
  sub?: string | number;
  exp?: number;
  iat?: number;
  roles?: string[] | string | number[] | number;
  role?: string | number;
  instituto?: string | number;
  centro?: string | number;
  institution?: string | number;
  [k: string]: any;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private url = `${environment.apiUrl}/auth/login`;

  private currentUserSubject = new BehaviorSubject<DecodedToken | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient, 
    private router: Router,
    private multiSessionService: MultiSessionService
  ) {
    this.restoreFromStorage();
  }

  /**
   * Llama al backend y guarda el token. Emite el usuario decodificado.
   */
  login(cui: string, password: string): Observable<{ access_token?: string; token?: string; [k: string]: any }> {
    return this.http.post<{ access_token?: string; token?: string; [k: string]: any }>(this.url, { cui, password }).pipe(
      tap(async (res) => {
        await this.processLoginResponse(res, cui);
      })
    );
  }

  /**
   * Procesa la respuesta del login de forma asíncrona
   */
  private async processLoginResponse(res: any, cui: string): Promise<void> {
    console.log('🔐 AuthService.processLoginResponse:', res);

    const token = res?.access_token ?? res?.token;
    if (token) {
      const decoded = this.decodeToken(token);
      if (decoded) {
        const userId = decoded.sub || decoded['id'];
        
        if (!userId) {
          console.error('❌ Token no contiene ID de usuario válido:', decoded);
          throw new Error('Token inválido: no contiene ID de usuario');
        }

        console.log('🔐 Iniciando sesión para usuario ID:', userId);
        console.log('CUI usado:', cui);
        
        const userName = cui;
        const userRole = decoded.roles || decoded.role || 1;

        // Verificar si ya hay una sesión en esta pestaña
        const existingSession = this.multiSessionService.getCurrentTabSession();
        if (existingSession && existingSession.userId !== userId) {
          const shouldContinue = confirm(
            `Ya hay una sesión activa del usuario ${existingSession.userId} en esta pestaña.\n\n` +
            `¿Deseas cerrar esa sesión e iniciar con el usuario ${userId}?`
          );
          
          if (!shouldContinue) {
            console.log('❌ Usuario canceló el cambio de sesión');
            throw new Error('Login cancelado por el usuario');
          }
          
          console.log('✅ Usuario confirmó el cambio de sesión');
        }

        // Crear nueva sesión de pestaña
        this.multiSessionService.createTabSession(userId, userName, Number(userRole), token);
        
        // Actualizar estado del servicio
        this.currentUserSubject.next(decoded);
        
        console.log('✅ Sesión de pestaña iniciada correctamente');
        
        // Mostrar reporte de sesiones
        const report = this.multiSessionService.getSessionsReport();
        console.log('📋 Reporte de sesiones:', report);
      }
    }
  }

  /**
   * Cerrar sesión de esta pestaña
   */
  logout() {
    console.log('🚪 Cerrando sesión de pestaña actual');
    
    // Cerrar sesión de esta pestaña específica
    this.multiSessionService.logoutCurrentTab();
    
    // Actualizar estado del servicio
    this.currentUserSubject.next(null);
    
    // Navegar al login
    this.router.navigate(['/login']);
    
    console.log('✅ Sesión cerrada correctamente');
    
    // Mostrar reporte actualizado
    const report = this.multiSessionService.getSessionsReport();
    console.log('📋 Reporte después del logout:', report);
  }

  /**
   * Obtener token de la sesión actual
   */
  getToken(): string | null {
    return this.multiSessionService.getCurrentToken();
  }

  /**
   * Verificar si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    const session = this.multiSessionService.getCurrentTabSession();
    if (!session) return false;
    
    // Verificar que el token no esté expirado
    const decoded = this.decodeToken(session.token);
    if (!decoded) return false;
    
    const now = Math.floor(Date.now() / 1000);
    const isExpired = decoded.exp ? decoded.exp < now : false;
    
    if (isExpired) {
      console.log('⏰ Token expirado, cerrando sesión');
      this.multiSessionService.logoutCurrentTab();
      return false;
    }
    
    // Actualizar última actividad
    this.multiSessionService.updateActivity();
    
    return true;
  }

  /**
   * Obtener usuario actual
   */
  getCurrentUser(): DecodedToken | null {
    return this.currentUserSubject.value;
  }

  /**
   * Verificar si el usuario tiene un rol específico
   */
  hasRole(requiredRole: number): boolean {
    const session = this.multiSessionService.getCurrentTabSession();
    return session ? session.role === requiredRole : false;
  }

  /**
   * Obtener nombre del rol del usuario actual
   */
  getCurrentUserRole(): string {
    const session = this.multiSessionService.getCurrentTabSession();
    if (!session) return 'Sin rol';
    
    const roleNameValue = roleName(session.role);
    return roleNameValue || 'Rol desconocido';
  }

  /**
   * Decodificar token JWT (método público para compatibilidad)
   */
  decodeToken(token: string): DecodedToken | null {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error('Error decodificando token:', e);
      return null;
    }
  }

  /**
   * Restaurar sesión desde almacenamiento
   */
  private restoreFromStorage(): void {
    console.log('🔄 AuthService.restoreFromStorage() - Iniciando restauración...');
    const session = this.multiSessionService.getCurrentTabSession();
    console.log('🔄 AuthService.restoreFromStorage() - Session obtenida:', session);
    
    if (session && this.isAuthenticated()) {
      const decoded = this.decodeToken(session.token);
      console.log('🔄 AuthService.restoreFromStorage() - Token decodificado:', decoded);
      
      if (decoded) {
        this.currentUserSubject.next(decoded);
        console.log('🔄 Sesión restaurada desde almacenamiento:', session.userId);
      }
    } else {
      console.log('🔄 No hay sesión válida para restaurar');
    }
  }

  /**
   * Obtener reporte completo de sesiones (para debugging)
   */
  getSessionReport() {
    return this.multiSessionService.getSessionsReport();
  }

  /**
   * Obtener rol normalizado del usuario actual
   */
  getNormalizedRole(): number {
    const session = this.multiSessionService.getCurrentTabSession();
    return session ? session.role : 0;
  }

  /**
   * Revalidar sesión actual
   */
  revalidateSession(): void {
    if (!this.isAuthenticated()) {
      console.log('❌ Sesión inválida detectada durante revalidación');
      this.logout();
    }
  }

  /**
   * Obtener información del token actual
   */
  getTokenInfo(): {
    token: string | null;
    decoded: DecodedToken | null;
    session: any;
    hasToken: boolean;
    error?: string;
    currentUserId?: string;
    activeSessions: number;
    issuedAt?: Date;
    expiresAt?: Date;
    isExpired: boolean;
    roles?: any;
    userId?: string;
    isAdmin: boolean;
    allSessions: any[];
  } {
    const session = this.multiSessionService.getCurrentTabSession();
    const token = session?.token || null;
    const decoded = token ? this.decodeToken(token) : null;
    
    // Calcular si el token está expirado
    const now = Math.floor(Date.now() / 1000);
    const isExpired = decoded?.exp ? decoded.exp < now : false;
    
    // Obtener información de sesiones globales
    const report = this.multiSessionService.getSessionsReport();
    
    return {
      token,
      decoded,
      session,
      hasToken: !!token,
      error: !token ? 'No hay token disponible' : undefined,
      currentUserId: session?.userId,
      activeSessions: report.totalTabs,
      issuedAt: decoded?.iat ? new Date(decoded.iat * 1000) : undefined,
      expiresAt: decoded?.exp ? new Date(decoded.exp * 1000) : undefined,
      isExpired,
      roles: decoded?.roles || decoded?.role,
      userId: session?.userId,
      isAdmin: session?.role === 3, // Rol 3 = Administrador
      allSessions: report.globalSessions
    };
  }

  /**
   * Limpiar sesiones expiradas
   */
  cleanExpiredSessions(): number {
    // Por ahora, solo verificamos la sesión actual
    if (!this.isAuthenticated()) {
      this.logout();
      return 1;
    }
    return 0;
  }

  /**
   * Obtener ID del usuario actual (compatibilidad)
   */
  getUserId(): string | null {
    const session = this.multiSessionService.getCurrentTabSession();
    console.log('🔍 AuthService.getUserId() - Session:', session);
    const userId = session ? session.userId : null;
    console.log('🔍 AuthService.getUserId() - Returning:', userId);
    return userId;
  }

  /**
   * Obtener rol del usuario actual (compatibilidad)
   */
  getUserRole(): number {
    const session = this.multiSessionService.getCurrentTabSession();
    return session ? session.role : 0;
  }

  /**
   * Obtener instituto/centro del usuario actual (compatibilidad)
   * Devuelve number para compatibilidad con las interfaces existentes
   */
  getUserInstituto(): number | null {
    const session = this.multiSessionService.getCurrentTabSession();
    if (!session) return null;
    
    // Si el instituto está en el token decodificado
    const decoded = this.decodeToken(session.token);
    const instituto = decoded?.['instituto'] || decoded?.['centro'] || decoded?.['institution'];
    
    // Convertir a número si es posible
    if (instituto !== null && instituto !== undefined) {
      const num = Number(instituto);
      return isNaN(num) ? null : num;
    }
    
    return null;
  }
}