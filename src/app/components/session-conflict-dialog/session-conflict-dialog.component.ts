import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SessionInfo } from '../../services/session-manager.service';

@Component({
  selector: 'app-session-conflict-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dialog-overlay" (click)="onCancel()">
      <div class="dialog-content" (click)="$event.stopPropagation()">
        <div class="dialog-header">
          <h2>🚨 Conflicto de Sesión Detectado</h2>
        </div>
        
        <div class="dialog-body">
          <p>Se detectó que otro usuario está intentando iniciar sesión:</p>
          
          <div class="user-info current-user">
            <h3>👤 Usuario Actual:</h3>
            <p><strong>ID:</strong> {{ currentUser.userId }}</p>
            <p><strong>Nombre:</strong> {{ currentUser.userName }}</p>
            <p><strong>Rol:</strong> {{ getRoleName(currentUser.role) }}</p>
            <p><strong>Última actividad:</strong> {{ formatDate(currentUser.lastActivity) }}</p>
          </div>

          <div class="user-info new-user">
            <h3>🆕 Nuevo Usuario:</h3>
            <p><strong>ID:</strong> {{ newUserId }}</p>
            <p><strong>Rol:</strong> {{ getRoleName(newUserRole) }}</p>
          </div>

          <p class="warning">
            ⚠️ Si continúas, la sesión actual se cerrará y se iniciará la nueva sesión.
          </p>
        </div>

        <div class="dialog-actions">
          <button class="btn btn-secondary" (click)="onCancel()">
            ❌ Cancelar
          </button>
          <button class="btn btn-primary" (click)="onContinue()">
            ✅ Continuar con nuevo usuario
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dialog-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    }

    .dialog-content {
      background: white;
      border-radius: 12px;
      padding: 0;
      max-width: 500px;
      width: 90%;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
      animation: slideIn 0.2s ease-out;
    }

    @keyframes slideIn {
      from { transform: scale(0.9); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }

    .dialog-header {
      background: #fee2e2;
      padding: 20px 24px;
      border-radius: 12px 12px 0 0;
      border-bottom: 1px solid #fecaca;
    }

    .dialog-header h2 {
      margin: 0;
      color: #dc2626;
      font-size: 1.25rem;
      font-weight: 600;
    }

    .dialog-body {
      padding: 24px;
    }

    .user-info {
      background: #f8fafc;
      border-radius: 8px;
      padding: 16px;
      margin: 16px 0;
      border-left: 4px solid #e5e7eb;
    }

    .current-user {
      border-left-color: #3b82f6;
      background: #eff6ff;
    }

    .new-user {
      border-left-color: #10b981;
      background: #ecfdf5;
    }

    .user-info h3 {
      margin: 0 0 12px 0;
      color: #374151;
      font-size: 1rem;
      font-weight: 600;
    }

    .user-info p {
      margin: 4px 0;
      color: #6b7280;
      font-size: 0.9rem;
    }

    .warning {
      background: #fef3c7;
      border: 1px solid #f59e0b;
      border-radius: 6px;
      padding: 12px;
      color: #92400e;
      font-weight: 500;
    }

    .dialog-actions {
      padding: 20px 24px;
      background: #f9fafb;
      border-radius: 0 0 12px 12px;
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }

    .btn {
      padding: 8px 16px;
      border-radius: 6px;
      border: none;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
    }

    .btn-primary:hover {
      background: #2563eb;
    }

    .btn-secondary {
      background: #f3f4f6;
      color: #374151;
      border: 1px solid #d1d5db;
    }

    .btn-secondary:hover {
      background: #e5e7eb;
    }
  `]
})
export class SessionConflictDialogComponent {
  constructor(
    @Inject('currentUser') public currentUser: SessionInfo,
    @Inject('newUserId') public newUserId: string,
    @Inject('newUserRole') public newUserRole: number,
    @Inject('onContinue') public onContinue: () => void,
    @Inject('onCancel') public onCancel: () => void
  ) {}

  getRoleName(role: number): string {
    switch (role) {
      case 1: return 'Ciudadano';
      case 2: return 'Médico';
      case 3: return 'Administrador';
      case 4: return 'Consultor';
      default: return 'Desconocido';
    }
  }

  formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString('es-GT');
  }
}