import { Injectable, Inject } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { MultiSessionService } from './multi-session.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private router: Router, 
    private multiSessionService: MultiSessionService
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Obtener token usando el nuevo sistema de multi-sesiones
    const token = this.multiSessionService.getCurrentToken();
    
    console.log('🔐 AuthInterceptor - Token obtenido:', token ? token.substring(0, 20) + '...' : 'null');
    
    const authReq = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

    return next.handle(authReq).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === 401) {
          console.warn('🔐 Token inválido o expirado (401). Limpiando sesión...');
          
          // Limpiar sesión usando el nuevo sistema
          this.multiSessionService.logoutCurrentTab();
          
          // Navegar al login
          try {
            this.router.navigate(['/login']);
          } catch (e) {
            console.error('Error navegando al login:', e);
          }
        } else if (err.status === 403) {
          const session = this.multiSessionService.getCurrentTabSession();
          console.warn('🚫 Acceso prohibido (403). El usuario no tiene permisos.');
          console.warn('Usuario actual:', session?.userId);
          console.warn('Rol del usuario:', session?.role);
          console.warn('Token usado:', token?.substring(0, 20) + '...');
        }
        return throwError(() => err);
      })
    );
  }
}
