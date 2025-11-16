import { Injectable } from '@angular/core';
import { SessionInfo } from './session-manager.service';

@Injectable({
  providedIn: 'root'
})
export class DialogService {
  
  showSessionConflictDialog(
    currentUser: SessionInfo,
    newUserId: string,
    newUserRole: number
  ): Promise<boolean> {
    return new Promise((resolve) => {
      const roleNames = {
        1: 'Ciudadano',
        2: 'Médico',
        3: 'Administrador',
        4: 'Consultor'
      };

      const currentRoleName = roleNames[currentUser.role as keyof typeof roleNames] || 'Desconocido';
      const newRoleName = roleNames[newUserRole as keyof typeof roleNames] || 'Desconocido';

      const message = `🚨 CONFLICTO DE SESIÓN DETECTADO\n\n` +
        `Usuario actual:\n` +
        `• ID: ${currentUser.userId}\n` +
        `• Nombre: ${currentUser.userName}\n` +
        `• Rol: ${currentRoleName}\n` +
        `• Última actividad: ${new Date(currentUser.lastActivity).toLocaleString('es-GT')}\n\n` +
        `Nuevo usuario intentando iniciar sesión:\n` +
        `• ID: ${newUserId}\n` +
        `• Rol: ${newRoleName}\n\n` +
        `⚠️ Si continúas, la sesión actual se cerrará y se iniciará la nueva sesión.\n\n` +
        `¿Deseas continuar con el nuevo usuario?`;

      const userChoice = confirm(message);
      resolve(userChoice);
    });
  }
}