import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface SessionInfo {
  userId: string;
  userName: string;
  role: number;
  loginTime: Date;
  lastActivity: Date;
  token: string;
}

@Injectable({
  providedIn: 'root'
})
export class SessionManagerService {
  private readonly SESSION_KEY = 'active_sessions';
  private readonly CURRENT_SESSION_KEY = 'current_session_id';
  
  private currentSessionSubject = new BehaviorSubject<SessionInfo | null>(null);
  public currentSession$ = this.currentSessionSubject.asObservable();

  constructor() {
    this.loadCurrentSession();
  }

  /**
   * Agregar nueva sesión o actualizar existente
   */
  addSession(userId: string, userName: string, role: number, token: string): SessionInfo {
    const sessions = this.getAllSessions();
    const now = new Date();
    
    // Verificar si ya existe una sesión para este usuario
    const existingIndex = sessions.findIndex(s => s.userId === userId);
    
    const sessionInfo: SessionInfo = {
      userId,
      userName,
      role,
      loginTime: existingIndex >= 0 ? sessions[existingIndex].loginTime : now,
      lastActivity: now,
      token
    };
    
    if (existingIndex >= 0) {
      sessions[existingIndex] = sessionInfo;
      console.log('🔄 Sesión actualizada para usuario:', userId);
    } else {
      sessions.push(sessionInfo);
      console.log('➕ Nueva sesión agregada para usuario:', userId);
    }
    
    // Guardar sesiones
    localStorage.setItem(this.SESSION_KEY, JSON.stringify(sessions));
    
    // Establecer como sesión actual
    this.setCurrentSession(userId);
    
    return sessionInfo;
  }

  /**
   * Obtener sesión activa actual
   */
  getActiveSession(): SessionInfo | null {
    const currentUserId = localStorage.getItem('current_user_id');
    if (currentUserId) {
      const sessions = this.getAllSessions();
      return sessions.find((session: SessionInfo) => session.userId === currentUserId) || null;
    }
    return null;
  }

  /**
   * Obtener todas las sesiones activas
   */
  getAllSessions(): SessionInfo[] {
    try {
      const sessionsJson = localStorage.getItem(this.SESSION_KEY);
      return sessionsJson ? JSON.parse(sessionsJson) : [];
    } catch (e) {
      console.warn('Error loading sessions:', e);
      return [];
    }
  }

  /**
   * Obtener sesión actual
   */
  getCurrentSession(): SessionInfo | null {
    const currentSessionId = localStorage.getItem(this.CURRENT_SESSION_KEY);
    if (!currentSessionId) return null;
    
    const sessions = this.getAllSessions();
    return sessions.find(s => s.userId === currentSessionId) || null;
  }

  /**
   * Establecer sesión actual
   */
  setCurrentSession(userId: string): boolean {
    const sessions = this.getAllSessions();
    const session = sessions.find(s => s.userId === userId);
    
    if (session) {
      localStorage.setItem(this.CURRENT_SESSION_KEY, userId);
      this.currentSessionSubject.next(session);
      console.log('✅ Sesión actual establecida:', userId);
      return true;
    }
    
    console.warn('❌ Sesión no encontrada:', userId);
    return false;
  }

  /**
   * Remover sesión
   */
  removeSession(userId: string): void {
    const sessions = this.getAllSessions();
    const filteredSessions = sessions.filter(s => s.userId !== userId);
    
    localStorage.setItem(this.SESSION_KEY, JSON.stringify(filteredSessions));
    
    // Si era la sesión actual, limpiar
    const currentSessionId = localStorage.getItem(this.CURRENT_SESSION_KEY);
    if (currentSessionId === userId) {
      localStorage.removeItem(this.CURRENT_SESSION_KEY);
      this.currentSessionSubject.next(null);
    }
    
    console.log('🗑️ Sesión removida:', userId);
  }

  /**
   * Limpiar todas las sesiones
   */
  clearAllSessions(): void {
    localStorage.removeItem(this.SESSION_KEY);
    localStorage.removeItem(this.CURRENT_SESSION_KEY);
    this.currentSessionSubject.next(null);
    console.log('🧹 Todas las sesiones limpiadas');
  }

  /**
   * Verificar si hay conflicto de usuarios
   */
  checkForUserConflict(newUserId: string): { hasConflict: boolean; currentUser?: SessionInfo } {
    const currentSession = this.getCurrentSession();
    
    if (currentSession && currentSession.userId !== newUserId) {
      return { hasConflict: true, currentUser: currentSession };
    }
    
    return { hasConflict: false };
  }

  /**
   * Cargar sesión actual al inicializar
   */
  private loadCurrentSession(): void {
    const currentSession = this.getCurrentSession();
    this.currentSessionSubject.next(currentSession);
  }

  /**
   * Actualizar última actividad
   */
  updateLastActivity(userId?: string): void {
    const targetUserId = userId || localStorage.getItem(this.CURRENT_SESSION_KEY);
    if (!targetUserId) return;
    
    const sessions = this.getAllSessions();
    const sessionIndex = sessions.findIndex(s => s.userId === targetUserId);
    
    if (sessionIndex >= 0) {
      sessions[sessionIndex].lastActivity = new Date();
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(sessions));
    }
  }
}