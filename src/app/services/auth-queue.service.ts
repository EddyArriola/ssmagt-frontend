import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, merge } from 'rxjs';
import { concatMap, debounceTime, distinctUntilChanged } from 'rxjs/operators';

interface AuthRequest {
  id: string;
  cui: string;
  password: string;
  timestamp: number;
  resolve: (result: any) => void;
  reject: (error: any) => void;
}

@Injectable({
  providedIn: 'root'
})
export class AuthQueueService {
  private requestQueue = new Subject<AuthRequest>();
  private activeRequests = new Map<string, AuthRequest>();
  private requestCounter = 0;

  constructor() {
    this.setupRequestProcessor();
  }

  /**
   * Procesar múltiples solicitudes de autenticación de forma no bloqueante
   */
  queueAuthRequest(cui: string, password: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const requestId = `auth_${++this.requestCounter}_${Date.now()}`;
      
      const request: AuthRequest = {
        id: requestId,
        cui,
        password,
        timestamp: Date.now(),
        resolve,
        reject
      };

      console.log(`🔄 Encolando request de autenticación: ${requestId}`);
      
      this.activeRequests.set(requestId, request);
      this.requestQueue.next(request);
    });
  }

  /**
   * Configurar procesador de cola no bloqueante
   */
  private setupRequestProcessor(): void {
    // Procesar requests con debounce para evitar spam
    this.requestQueue.pipe(
      debounceTime(50), // Esperar 50ms entre requests
      distinctUntilChanged((prev, curr) => 
        prev.cui === curr.cui && prev.password === curr.password
      ),
      concatMap(async (request) => {
        return this.processAuthRequest(request);
      })
    ).subscribe({
      next: (result) => {
        console.log('✅ Request procesado exitosamente');
      },
      error: (error) => {
        console.error('❌ Error procesando request:', error);
      }
    });
  }

  /**
   * Procesar request individual de forma asíncrona
   */
  private async processAuthRequest(request: AuthRequest): Promise<void> {
    const startTime = performance.now();
    
    try {
      console.log(`🔐 Procesando autenticación para: ${request.cui} (ID: ${request.id})`);
      
      // Simular procesamiento asíncrono
      await this.simulateAsyncAuth(request);
      
      const duration = performance.now() - startTime;
      console.log(`⚡ Request ${request.id} completado en ${duration.toFixed(2)}ms`);
      
      // Limpiar de requests activos
      this.activeRequests.delete(request.id);
      
      request.resolve({
        success: true,
        duration: duration,
        timestamp: Date.now()
      });
      
    } catch (error) {
      console.error(`💥 Error en request ${request.id}:`, error);
      this.activeRequests.delete(request.id);
      request.reject(error);
    }
  }

  /**
   * Simular autenticación asíncrona no bloqueante
   */
  private async simulateAsyncAuth(request: AuthRequest): Promise<void> {
    return new Promise((resolve, reject) => {
      // Usar setTimeout para simular operación asíncrona
      setTimeout(() => {
        // Simular validación exitosa
        if (request.cui && request.password) {
          resolve();
        } else {
          reject(new Error('Credenciales inválidas'));
        }
      }, Math.random() * 100); // Tiempo variable 0-100ms
    });
  }

  /**
   * Obtener estadísticas de rendimiento
   */
  getQueueStats(): {
    activeRequests: number;
    requestIds: string[];
    oldestRequest: number;
  } {
    const requests = Array.from(this.activeRequests.values());
    const now = Date.now();
    
    return {
      activeRequests: requests.length,
      requestIds: requests.map(r => r.id),
      oldestRequest: requests.length > 0 
        ? Math.min(...requests.map(r => now - r.timestamp))
        : 0
    };
  }

  /**
   * Limpiar requests antiguos (mayor a 30 segundos)
   */
  cleanupOldRequests(): number {
    const now = Date.now();
    const oldRequests: string[] = [];
    
    this.activeRequests.forEach((request, id) => {
      if (now - request.timestamp > 30000) { // 30 segundos
        oldRequests.push(id);
        request.reject(new Error('Request timeout'));
      }
    });

    oldRequests.forEach(id => this.activeRequests.delete(id));
    
    if (oldRequests.length > 0) {
      console.log(`🧹 Limpiados ${oldRequests.length} requests antiguos`);
    }
    
    return oldRequests.length;
  }
}