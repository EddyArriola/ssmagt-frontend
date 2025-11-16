import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class TokenExpirationMonitorService {
  private monitorInterval: any;
  private avisoMostrado = false;
  private avisosCriticosMostrados = new Set<number>();

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  /**
   * Iniciar el monitor global de expiración
   */
  iniciarMonitor(): void {
    console.log('⏰ Iniciando monitor de expiración de tokens');
    
    // Limpiar monitor anterior si existe
    this.detenerMonitor();
    
    // Verificar cada 30 segundos
    this.monitorInterval = setInterval(() => {
      this.verificarExpiracion();
    }, 30000);
  }

  /**
   * Detener el monitor
   */
  detenerMonitor(): void {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
      console.log('⏰ Monitor de expiración detenido');
    }
  }

  /**
   * Verificar el estado de expiración del token
   */
  private verificarExpiracion(): void {
    const tokenInfo = this.authService.getTokenInfo();
    
    if (!tokenInfo.hasToken || tokenInfo.isExpired) {
      this.detenerMonitor();
      return;
    }

    if (tokenInfo.expiresAt) {
      const ahora = new Date();
      const tiempoRestante = tokenInfo.expiresAt.getTime() - ahora.getTime();
      const minutosRestantes = Math.floor(tiempoRestante / (1000 * 60));

      // Log de debug cada verificación
      console.log(`⏰ Monitor: Token expira en ${minutosRestantes} minutos`);

      // Aviso de 15 minutos (solo una vez)
      if (minutosRestantes <= 15 && minutosRestantes > 10 && !this.avisoMostrado) {
        this.mostrarAvisoExpiracion(minutosRestantes, 'warning');
      }

      // Aviso de 10 minutos (solo una vez)
      if (minutosRestantes <= 10 && minutosRestantes > 5 && !this.avisoMostrado) {
        this.avisoMostrado = true;
        this.mostrarAvisoExpiracion(minutosRestantes, 'critical');
      }

      // Avisos críticos (cada minuto en los últimos 5 minutos)
      if (minutosRestantes <= 5 && minutosRestantes > 0) {
        if (!this.avisosCriticosMostrados.has(minutosRestantes)) {
          this.avisosCriticosMostrados.add(minutosRestantes);
          this.mostrarAvisoExpiracionCritica(minutosRestantes);
        }
      }

      // Cierre automático cuando el token está expirado
      if (minutosRestantes <= 0) {
        this.manejarTokenExpirado();
      }
    }
  }

  /**
   * Mostrar aviso de expiración
   */
  private mostrarAvisoExpiracion(minutos: number, tipo: 'warning' | 'critical'): void {
    const icono = tipo === 'critical' ? '🚨' : '⚠️';
    const titulo = tipo === 'critical' ? 'AVISO CRÍTICO' : 'AVISO DE EXPIRACIÓN';
    
    console.warn(`${icono} ${titulo}: Tu sesión expirará en ${minutos} minutos`);
    
    const mensaje = 
      `${icono} ${titulo}\n\n` +
      `Tu sesión expirará en ${minutos} minutos.\n\n` +
      `Para evitar perder tu trabajo:\n` +
      `• Guarda cualquier cambio importante\n` +
      `• Considera refrescar la página para renovar la sesión\n` +
      `• O vuelve a iniciar sesión\n\n` +
      `¿Quieres continuar trabajando?`;

    const continuar = confirm(mensaje);
    
    if (!continuar) {
      this.authService.logout();
      this.router.navigate(['/login']);
    }
  }

  /**
   * Mostrar aviso crítico de expiración
   */
  private mostrarAvisoExpiracionCritica(minutos: number): void {
    console.error(`🔥 CRÍTICO: Sesión expira en ${minutos} minutos`);
    
    // Mostrar notificación visual menos intrusiva
    this.mostrarNotificacionTemporal(
      `🔥 SESIÓN EXPIRANDO: ${minutos} ${minutos === 1 ? 'minuto' : 'minutos'} restantes`,
      'error'
    );

    // Si queda solo 1 minuto, mostrar diálogo final
    if (minutos === 1) {
      const extender = confirm(
        '🔥 ÚLTIMO MINUTO\n\n' +
        'Tu sesión expira en 1 minuto.\n\n' +
        '¿Quieres extender la sesión?\n\n' +
        'Presiona OK para ir al login y renovar tu sesión.\n' +
        'Presiona Cancelar para cerrar sesión automáticamente.'
      );

      if (extender) {
        this.router.navigate(['/login']);
      }
    }
  }

  /**
   * Manejar token completamente expirado
   */
  private manejarTokenExpirado(): void {
    console.error('💀 TOKEN EXPIRADO - Cerrando sesión automáticamente');
    
    this.detenerMonitor();
    
    alert(
      '💀 SESIÓN EXPIRADA\n\n' +
      'Tu sesión ha expirado por seguridad.\n\n' +
      'Serás redirigido al login para iniciar una nueva sesión.'
    );

    this.authService.logout();
    this.router.navigate(['/login']);
  }

  /**
   * Mostrar notificación temporal en la interfaz
   */
  private mostrarNotificacionTemporal(mensaje: string, tipo: 'info' | 'warning' | 'error'): void {
    // Verificar si ya existe una notificación para evitar duplicados
    const existente = document.querySelector('.token-expiration-notification');
    if (existente) {
      existente.remove();
    }

    const notificacion = document.createElement('div');
    notificacion.className = 'token-expiration-notification';
    notificacion.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px 20px;
      background: ${tipo === 'error' ? '#ff4444' : tipo === 'warning' ? '#ffaa00' : '#4CAF50'};
      color: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 10000;
      font-weight: bold;
      max-width: 350px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      animation: slideInRight 0.3s ease-out;
      border-left: 4px solid rgba(255,255,255,0.3);
    `;
    
    notificacion.textContent = mensaje;
    document.body.appendChild(notificacion);

    // Remover después de 4 segundos
    setTimeout(() => {
      if (notificacion.parentNode) {
        notificacion.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => {
          if (notificacion.parentNode) {
            notificacion.parentNode.removeChild(notificacion);
          }
        }, 300);
      }
    }, 4000);
  }

  /**
   * Obtener información del estado del token
   */
  obtenerEstadoToken(): {
    minutosRestantes: number;
    estadoTexto: string;
    nivelAlerta: 'normal' | 'warning' | 'critical' | 'expired';
  } {
    const tokenInfo = this.authService.getTokenInfo();
    
    if (!tokenInfo.hasToken) {
      return {
        minutosRestantes: 0,
        estadoTexto: 'Sin sesión activa',
        nivelAlerta: 'expired'
      };
    }

    if (tokenInfo.isExpired) {
      return {
        minutosRestantes: 0,
        estadoTexto: 'Token expirado',
        nivelAlerta: 'expired'
      };
    }

    if (tokenInfo.expiresAt) {
      const ahora = new Date();
      const tiempoRestante = tokenInfo.expiresAt.getTime() - ahora.getTime();
      const minutosRestantes = Math.floor(tiempoRestante / (1000 * 60));

      let nivelAlerta: 'normal' | 'warning' | 'critical' | 'expired' = 'normal';
      let estadoTexto = `${minutosRestantes} minutos restantes`;

      if (minutosRestantes <= 0) {
        nivelAlerta = 'expired';
        estadoTexto = 'Expirado';
      } else if (minutosRestantes <= 5) {
        nivelAlerta = 'critical';
        estadoTexto = `¡CRÍTICO! ${minutosRestantes} minutos`;
      } else if (minutosRestantes <= 15) {
        nivelAlerta = 'warning';
        estadoTexto = `⚠️ ${minutosRestantes} minutos`;
      }

      return {
        minutosRestantes,
        estadoTexto,
        nivelAlerta
      };
    }

    return {
      minutosRestantes: 0,
      estadoTexto: 'Información no disponible',
      nivelAlerta: 'expired'
    };
  }

  /**
   * Reiniciar los avisos (útil cuando se renueva la sesión)
   */
  reiniciarAvisos(): void {
    this.avisoMostrado = false;
    this.avisosCriticosMostrados.clear();
    console.log('⏰ Avisos de expiración reiniciados');
  }
}