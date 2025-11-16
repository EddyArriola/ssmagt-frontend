import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MultiSessionService } from '../../services/multi-session.service';
import { AuthService } from '../../services/auth.service';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-session-monitor',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="session-monitor">
      <h2>🔍 Monitor de Sesiones Múltiples</h2>
      
      <!-- Sesión actual de esta pestaña -->
      <div class="current-tab-session">
        <h3>📋 Sesión Actual (Esta Pestaña)</h3>
        <div *ngIf="currentTabSession; else noCurrentSession" class="session-card current">
          <p><strong>🆔 ID Usuario:</strong> {{ currentTabSession.userId }}</p>
          <p><strong>👤 Nombre:</strong> {{ currentTabSession.userName }}</p>
          <p><strong>🎭 Rol:</strong> {{ getRoleName(currentTabSession.role) }}</p>
          <p><strong>🔗 ID Pestaña:</strong> {{ currentTabSession.tabId }}</p>
          <p><strong>⏰ Login:</strong> {{ formatDate(currentTabSession.loginTime) }}</p>
          <p><strong>🕐 Última Actividad:</strong> {{ formatDate(currentTabSession.lastActivity) }}</p>
          <p><strong>🔑 Token:</strong> <code>{{ currentTabSession.token.substring(0, 20) }}...</code></p>
        </div>
        <ng-template #noCurrentSession>
          <div class="no-session">
            ❌ No hay sesión activa en esta pestaña
          </div>
        </ng-template>
      </div>

      <!-- Sesiones globales -->
      <div class="global-sessions">
        <h3>🌍 Sesiones Globales</h3>
        <div class="stats">
          <span class="stat">👥 Total Usuarios: {{ sessionReport.totalUsers }}</span>
          <span class="stat">📑 Total Pestañas: {{ sessionReport.totalTabs }}</span>
        </div>

        <div *ngIf="sessionReport.globalSessions.length > 0; else noGlobalSessions">
          <div 
            *ngFor="let session of sessionReport.globalSessions" 
            class="session-card global"
          >
            <p><strong>🆔 Usuario ID:</strong> {{ session.userId }}</p>
            <p><strong>👤 Nombre:</strong> {{ session.userName }}</p>
            <p><strong>🎭 Rol:</strong> {{ getRoleName(session.role) }}</p>
            <p><strong>📑 Pestañas Activas:</strong> {{ session.activeTabs.length }}</p>
            <p><strong>⏰ Login:</strong> {{ formatDate(session.loginTime) }}</p>
            <p><strong>🕐 Última Actividad:</strong> {{ formatDate(session.lastActivity) }}</p>
            <div class="tabs-list">
              <span *ngFor="let tabId of session.activeTabs" class="tab-chip">
                {{ tabId }}
              </span>
            </div>
          </div>
        </div>
        <ng-template #noGlobalSessions>
          <div class="no-session">
            📭 No hay sesiones globales activas
          </div>
        </ng-template>
      </div>

      <!-- Acciones -->
      <div class="actions">
        <button (click)="refreshData()" class="btn btn-primary">
          🔄 Actualizar
        </button>
        <button (click)="simulateActivity()" class="btn btn-secondary">
          ⚡ Simular Actividad
        </button>
        <button (click)="clearAllSessions()" class="btn btn-danger">
          🧹 Limpiar Todas las Sesiones
        </button>
      </div>

      <!-- Instrucciones -->
      <div class="instructions">
        <h3>💡 Cómo Probar</h3>
        <ol>
          <li>Abre esta aplicación en múltiples pestañas o navegadores</li>
          <li>Inicia sesión con diferentes usuarios en cada pestaña</li>
          <li>Observa cómo se muestran las sesiones independientes</li>
          <li>Cierra algunas pestañas y ve cómo se actualizan las sesiones</li>
        </ol>
      </div>
    </div>
  `,
  styles: [`
    .session-monitor {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    h2 {
      color: #2c3e50;
      text-align: center;
      margin-bottom: 30px;
    }

    h3 {
      color: #34495e;
      border-bottom: 2px solid #3498db;
      padding-bottom: 8px;
      margin-top: 30px;
    }

    .current-tab-session,
    .global-sessions {
      background: white;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }

    .session-card {
      background: #f8f9fa;
      border-radius: 6px;
      padding: 15px;
      margin-bottom: 15px;
      border-left: 4px solid #3498db;
    }

    .session-card.current {
      background: #e8f5e8;
      border-left-color: #27ae60;
    }

    .session-card.global {
      background: #fff3e0;
      border-left-color: #e67e22;
    }

    .session-card p {
      margin: 5px 0;
      font-size: 14px;
    }

    .session-card code {
      background: #2c3e50;
      color: #ecf0f1;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 12px;
    }

    .no-session {
      text-align: center;
      padding: 20px;
      color: #7f8c8d;
      font-style: italic;
    }

    .stats {
      display: flex;
      gap: 20px;
      margin-bottom: 15px;
    }

    .stat {
      background: #3498db;
      color: white;
      padding: 8px 12px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 500;
    }

    .tabs-list {
      margin-top: 10px;
    }

    .tab-chip {
      background: #95a5a6;
      color: white;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 11px;
      margin-right: 5px;
      display: inline-block;
    }

    .actions {
      text-align: center;
      margin: 30px 0;
    }

    .btn {
      margin: 0 10px;
      padding: 10px 20px;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s;
    }

    .btn-primary {
      background: #3498db;
      color: white;
    }

    .btn-secondary {
      background: #95a5a6;
      color: white;
    }

    .btn-danger {
      background: #e74c3c;
      color: white;
    }

    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    }

    .instructions {
      background: #ecf0f1;
      padding: 20px;
      border-radius: 8px;
      margin-top: 30px;
    }

    .instructions ol {
      margin-left: 20px;
    }

    .instructions li {
      margin-bottom: 8px;
      line-height: 1.5;
    }
  `]
})
export class SessionMonitorComponent implements OnInit, OnDestroy {
  currentTabSession: any = null;
  sessionReport: any = {
    globalSessions: [],
    totalUsers: 0,
    totalTabs: 0
  };

  private subscription?: Subscription;

  constructor(
    private multiSessionService: MultiSessionService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.refreshData();
    
    // Auto-refresh cada 5 segundos
    this.subscription = interval(5000).subscribe(() => {
      this.refreshData();
    });
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  refreshData() {
    this.currentTabSession = this.multiSessionService.getCurrentTabSession();
    this.sessionReport = this.multiSessionService.getSessionsReport();
    console.log('📊 Datos actualizados:', {
      currentTab: this.currentTabSession,
      report: this.sessionReport
    });
  }

  simulateActivity() {
    this.multiSessionService.updateActivity();
    this.refreshData();
    console.log('⚡ Actividad simulada');
  }

  clearAllSessions() {
    if (confirm('¿Estás seguro de que quieres limpiar TODAS las sesiones? Esto cerrará todas las sesiones activas.')) {
      this.multiSessionService.clearAllSessions();
      this.authService.logout();
      console.log('🧹 Todas las sesiones limpiadas');
    }
  }

  getRoleName(role: number): string {
    const roles: { [key: number]: string } = {
      1: 'Ciudadano',
      2: 'Médico', 
      3: 'Administrador',
      4: 'Consultor'
    };
    return roles[role] || 'Desconocido';
  }

  formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString('es-GT');
  }
}