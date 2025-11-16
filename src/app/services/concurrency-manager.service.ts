import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, fromEvent, merge } from 'rxjs';
import { throttleTime, debounceTime, shareReplay, retry } from 'rxjs/operators';
import { environment } from '../../environments/environment';

interface ConnectionStats {
  totalRequests: number;
  activeConnections: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  peakConcurrency: number;
}

@Injectable({
  providedIn: 'root'
})
export class ConcurrencyManagerService {
  private readonly MAX_CONCURRENT_REQUESTS = 10;
  private activeConnections = new Set<string>();
  private requestQueue: Array<() => Promise<any>> = [];
  private stats: ConnectionStats = {
    totalRequests: 0,
    activeConnections: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    peakConcurrency: 0
  };

  private statsSubject = new BehaviorSubject<ConnectionStats>(this.stats);
  public stats$ = this.statsSubject.asObservable();

  constructor(private http: HttpClient) {
    this.setupConcurrencyMonitoring();
    this.startQueueProcessor();
  }

  /**
   * Ejecutar request HTTP con control de concurrencia
   */
  async executeRequest<T>(
    requestFn: () => Observable<T>,
    requestId?: string
  ): Promise<T> {
    const id = requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return new Promise((resolve, reject) => {
      const wrappedRequest = async () => {
        const startTime = performance.now();
        
        try {
          // Registrar conexión activa
          this.activeConnections.add(id);
          this.updateActiveConnectionsCount();
          
          console.log(`🔄 Ejecutando request: ${id} (${this.activeConnections.size}/${this.MAX_CONCURRENT_REQUESTS})`);
          
          // Ejecutar request real
          const result = await requestFn().toPromise();
          
          const endTime = performance.now();
          const duration = endTime - startTime;
          
          // Actualizar estadísticas
          this.updateStats(true, duration);
          
          console.log(`✅ Request ${id} completado en ${duration.toFixed(2)}ms`);
          
          if (result !== undefined) {
            resolve(result);
          } else {
            reject(new Error('Request returned undefined'));
          }
          
        } catch (error) {
          console.error(`❌ Request ${id} falló:`, error);
          this.updateStats(false, performance.now() - startTime);
          reject(error);
          
        } finally {
          // Limpiar conexión activa
          this.activeConnections.delete(id);
          this.updateActiveConnectionsCount();
          
          // Procesar siguiente en cola
          this.processNextInQueue();
        }
      };

      // Verificar si hay espacio para ejecutar inmediatamente
      if (this.activeConnections.size < this.MAX_CONCURRENT_REQUESTS) {
        wrappedRequest();
      } else {
        // Agregar a cola
        console.log(`⏳ Request ${id} agregado a cola (${this.requestQueue.length + 1} en espera)`);
        this.requestQueue.push(wrappedRequest);
      }
    });
  }

  /**
   * Ejecutar múltiples requests de usuarios simultáneos
   */
  async executeUserRequests(userRequests: Array<{
    userId: string;
    requestFn: () => Observable<any>;
  }>): Promise<Array<{ userId: string; result?: any; error?: any }>> {
    
    console.log(`🚀 Ejecutando ${userRequests.length} requests simultáneos`);
    
    const promises = userRequests.map(async ({ userId, requestFn }) => {
      try {
        const result = await this.executeRequest(requestFn, `user_${userId}`);
        return { userId, result };
      } catch (error) {
        return { userId, error };
      }
    });

    return Promise.allSettled(promises).then(results => 
      results.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          return {
            userId: userRequests[index].userId,
            error: result.reason
          };
        }
      })
    );
  }

  /**
   * Procesar siguiente request en cola
   */
  private processNextInQueue(): void {
    if (this.requestQueue.length > 0 && 
        this.activeConnections.size < this.MAX_CONCURRENT_REQUESTS) {
      
      const nextRequest = this.requestQueue.shift();
      if (nextRequest) {
        nextRequest();
      }
    }
  }

  /**
   * Iniciar procesador de cola automático
   */
  private startQueueProcessor(): void {
    setInterval(() => {
      // Procesar cola cada 100ms si hay capacidad
      while (this.requestQueue.length > 0 && 
             this.activeConnections.size < this.MAX_CONCURRENT_REQUESTS) {
        this.processNextInQueue();
      }
      
      // Limpiar conexiones huérfanas (más de 30 segundos)
      this.cleanupStaleConnections();
      
    }, 100);
  }

  /**
   * Actualizar estadísticas de rendimiento
   */
  private updateStats(success: boolean, duration: number): void {
    this.stats.totalRequests++;
    
    if (success) {
      this.stats.successfulRequests++;
    } else {
      this.stats.failedRequests++;
    }
    
    // Calcular tiempo promedio de respuesta
    const totalSuccessful = this.stats.successfulRequests;
    this.stats.averageResponseTime = (
      (this.stats.averageResponseTime * (totalSuccessful - 1) + duration) / totalSuccessful
    );
    
    this.statsSubject.next({ ...this.stats });
  }

  /**
   * Actualizar conteo de conexiones activas
   */
  private updateActiveConnectionsCount(): void {
    this.stats.activeConnections = this.activeConnections.size;
    
    if (this.stats.activeConnections > this.stats.peakConcurrency) {
      this.stats.peakConcurrency = this.stats.activeConnections;
    }
    
    this.statsSubject.next({ ...this.stats });
  }

  /**
   * Limpiar conexiones obsoletas
   */
  private cleanupStaleConnections(): void {
    // En una implementación real, se verificarían timestamps
    // Por simplicidad, solo mostramos el concepto
    if (this.activeConnections.size > this.MAX_CONCURRENT_REQUESTS * 2) {
      console.warn(`⚠️ Detectadas ${this.activeConnections.size} conexiones activas (límite: ${this.MAX_CONCURRENT_REQUESTS})`);
    }
  }

  /**
   * Configurar monitoreo de concurrencia
   */
  private setupConcurrencyMonitoring(): void {
    // Monitorear rendimiento cada 5 segundos
    setInterval(() => {
      const stats = this.stats;
      
      if (stats.totalRequests > 0) {
        console.log(`📊 Estadísticas de Concurrencia:`, {
          'Total Requests': stats.totalRequests,
          'Conexiones Activas': stats.activeConnections,
          'Éxito': `${stats.successfulRequests}/${stats.totalRequests}`,
          'Tiempo Promedio': `${stats.averageResponseTime.toFixed(2)}ms`,
          'Pico Concurrencia': stats.peakConcurrency,
          'Cola': this.requestQueue.length
        });
      }
    }, 5000);

    // Detectar sobrecarga
    this.stats$.pipe(
      throttleTime(1000),
      debounceTime(500)
    ).subscribe(stats => {
      if (stats.activeConnections >= this.MAX_CONCURRENT_REQUESTS * 0.9) {
        console.warn(`🚨 Sistema cerca del límite de concurrencia: ${stats.activeConnections}/${this.MAX_CONCURRENT_REQUESTS}`);
      }
    });
  }

  /**
   * Simular carga de trabajo intensiva
   */
  async simulateHighLoad(numberOfUsers: number = 100): Promise<void> {
    console.log(`🔥 Simulando carga alta con ${numberOfUsers} usuarios simultáneos`);
    
    const userRequests = Array.from({ length: numberOfUsers }, (_, i) => ({
      userId: `user_${i + 1}`,
      requestFn: () => this.http.get(`${environment.apiUrl}/usuarios?page=${i % 10}`)
    }));

    const startTime = performance.now();
    const results = await this.executeUserRequests(userRequests);
    const duration = performance.now() - startTime;

    const successful = results.filter(r => r.result).length;
    const failed = results.filter(r => r.error).length;

    console.log(`📈 Simulación completada en ${duration.toFixed(2)}ms:`);
    console.log(`✅ Exitosos: ${successful}`);
    console.log(`❌ Fallidos: ${failed}`);
    console.log(`⚡ Throughput: ${(numberOfUsers / (duration / 1000)).toFixed(2)} requests/seg`);
  }

  /**
   * Resetear estadísticas
   */
  resetStats(): void {
    this.stats = {
      totalRequests: 0,
      activeConnections: this.activeConnections.size,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      peakConcurrency: 0
    };
    
    this.statsSubject.next({ ...this.stats });
    console.log('🔄 Estadísticas reseteadas');
  }
}