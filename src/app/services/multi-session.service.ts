import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface TabSession {
  tabId: string;
  userId: string;
  userName: string;
  role: number;
  token: string;
  loginTime: Date;
  lastActivity: Date;
}

export interface GlobalSession {
  userId: string;
  userName: string;
  role: number;
  activeTabs: string[];
  loginTime: Date;
  lastActivity: Date;
}

@Injectable({
  providedIn: 'root'
})
export class MultiSessionService {
  private readonly TAB_SESSION_KEY = 'tab_session';
  private readonly GLOBAL_SESSIONS_KEY = 'global_sessions';
  private readonly TAB_ID_KEY = 'tab_id';
  
  private currentTabSession = new BehaviorSubject<TabSession | null>(null);
  public currentTabSession$ = this.currentTabSession.asObservable();
  
  private globalSessions = new BehaviorSubject<GlobalSession[]>([]);
  public globalSessions$ = this.globalSessions.asObservable();
  
  private tabId: string;

  constructor() {
    this.tabId = this.initializeTabId();
    this.loadTabSession();
    this.loadGlobalSessions();
    this.setupStorageListener();
    
    console.log('🆔 MultiSessionService inicializado para tab:', this.tabId);
  }

  /**
   * Generar o recuperar ID único de pestaña
   */
  private initializeTabId(): string {
    // Usar sessionStorage para que sea único por pestaña
    let tabId = sessionStorage.getItem(this.TAB_ID_KEY);
    if (!tabId) {
      tabId = 'tab_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem(this.TAB_ID_KEY, tabId);
    }
    return tabId;
  }

  /**
   * Iniciar nueva sesión en esta pestaña
   */
  createTabSession(userId: string, userName: string, role: number, token: string): TabSession {
    const now = new Date();
    
    const tabSession: TabSession = {
      tabId: this.tabId,
      userId,
      userName,
      role,
      token,
      loginTime: now,
      lastActivity: now
    };

    // Guardar sesión de pestaña (sessionStorage - única por pestaña)
    sessionStorage.setItem(this.TAB_SESSION_KEY, JSON.stringify(tabSession));
    
    // Actualizar sesiones globales (localStorage - compartido)
    this.updateGlobalSession(userId, userName, role, this.tabId);
    
    this.currentTabSession.next(tabSession);
    
    console.log('✅ Nueva sesión de pestaña creada:', {
      tabId: this.tabId,
      userId,
      userName,
      role
    });
    
    return tabSession;
  }

  /**
   * Obtener sesión activa de esta pestaña
   */
  getCurrentTabSession(): TabSession | null {
    try {
      const sessionJson = sessionStorage.getItem(this.TAB_SESSION_KEY);
      const session = sessionJson ? JSON.parse(sessionJson) : null;
      console.log('🔍 MultiSession.getCurrentTabSession() - Raw JSON:', sessionJson);
      console.log('🔍 MultiSession.getCurrentTabSession() - Parsed session:', session);
      return session;
    } catch (e) {
      console.warn('Error cargando sesión de pestaña:', e);
      return null;
    }
  }

  /**
   * Obtener token de la sesión actual de esta pestaña
   */
  getCurrentToken(): string | null {
    const session = this.getCurrentTabSession();
    if (session) {
      console.log('🔐 MultiSessionService - Token obtenido para usuario:', session.userId);
      return session.token;
    }
    
    console.warn('🔐 MultiSessionService - No hay sesión activa en esta pestaña');
    return null;
  }

  /**
   * Verificar si hay una sesión activa en esta pestaña
   */
  hasActiveSession(): boolean {
    return this.getCurrentTabSession() !== null;
  }

  /**
   * Cerrar sesión de esta pestaña específica
   */
  logoutCurrentTab(): void {
    const session = this.getCurrentTabSession();
    if (session) {
      console.log('🚪 Cerrando sesión de pestaña:', this.tabId);
      
      // Remover sesión de pestaña
      sessionStorage.removeItem(this.TAB_SESSION_KEY);
      this.currentTabSession.next(null);
      
      // Actualizar sesiones globales
      this.removeTabFromGlobalSessions(session.userId, this.tabId);
    }
  }

  /**
   * Obtener todas las sesiones globales
   */
  getAllGlobalSessions(): GlobalSession[] {
    try {
      const sessionsJson = localStorage.getItem(this.GLOBAL_SESSIONS_KEY);
      return sessionsJson ? JSON.parse(sessionsJson) : [];
    } catch (e) {
      console.warn('Error cargando sesiones globales:', e);
      return [];
    }
  }

  /**
   * Verificar si un usuario tiene sesiones activas en otras pestañas
   */
  getUserActiveTabsCount(userId: string): number {
    const globalSessions = this.getAllGlobalSessions();
    const userSession = globalSessions.find(s => s.userId === userId);
    return userSession ? userSession.activeTabs.length : 0;
  }

  /**
   * Obtener información detallada de todas las sesiones
   */
  getSessionsReport(): {
    currentTab: TabSession | null;
    globalSessions: GlobalSession[];
    totalUsers: number;
    totalTabs: number;
  } {
    const currentTab = this.getCurrentTabSession();
    const globalSessions = this.getAllGlobalSessions();
    const totalUsers = globalSessions.length;
    const totalTabs = globalSessions.reduce((sum, session) => sum + session.activeTabs.length, 0);

    return {
      currentTab,
      globalSessions,
      totalUsers,
      totalTabs
    };
  }

  /**
   * Actualizar sesión global con nueva pestaña
   */
  private updateGlobalSession(userId: string, userName: string, role: number, tabId: string): void {
    const globalSessions = this.getAllGlobalSessions();
    const existingIndex = globalSessions.findIndex(s => s.userId === userId);
    const now = new Date();

    if (existingIndex >= 0) {
      // Usuario ya tiene sesiones activas, agregar esta pestaña
      const existingSession = globalSessions[existingIndex];
      if (!existingSession.activeTabs.includes(tabId)) {
        existingSession.activeTabs.push(tabId);
      }
      existingSession.lastActivity = now;
    } else {
      // Nuevo usuario, crear sesión global
      const newGlobalSession: GlobalSession = {
        userId,
        userName,
        role,
        activeTabs: [tabId],
        loginTime: now,
        lastActivity: now
      };
      globalSessions.push(newGlobalSession);
    }

    localStorage.setItem(this.GLOBAL_SESSIONS_KEY, JSON.stringify(globalSessions));
    this.globalSessions.next(globalSessions);
  }

  /**
   * Remover pestaña de sesiones globales
   */
  private removeTabFromGlobalSessions(userId: string, tabId: string): void {
    const globalSessions = this.getAllGlobalSessions();
    const sessionIndex = globalSessions.findIndex(s => s.userId === userId);

    if (sessionIndex >= 0) {
      const session = globalSessions[sessionIndex];
      session.activeTabs = session.activeTabs.filter(id => id !== tabId);

      if (session.activeTabs.length === 0) {
        // Si no quedan pestañas, remover sesión completa
        globalSessions.splice(sessionIndex, 1);
        console.log('🗑️ Sesión global removida para usuario:', userId);
      } else {
        session.lastActivity = new Date();
      }

      localStorage.setItem(this.GLOBAL_SESSIONS_KEY, JSON.stringify(globalSessions));
      this.globalSessions.next(globalSessions);
    }
  }

  /**
   * Cargar sesión de pestaña actual
   */
  private loadTabSession(): void {
    const session = this.getCurrentTabSession();
    this.currentTabSession.next(session);
  }

  /**
   * Cargar sesiones globales
   */
  private loadGlobalSessions(): void {
    const sessions = this.getAllGlobalSessions();
    this.globalSessions.next(sessions);
  }

  /**
   * Escuchar cambios en localStorage de otras pestañas
   */
  private setupStorageListener(): void {
    window.addEventListener('storage', (event) => {
      if (event.key === this.GLOBAL_SESSIONS_KEY) {
        console.log('📡 Detectado cambio en sesiones globales desde otra pestaña');
        this.loadGlobalSessions();
      }
    });

    // Limpiar sesión de pestaña al cerrar
    window.addEventListener('beforeunload', () => {
      this.logoutCurrentTab();
    });
  }

  /**
   * Actualizar última actividad de la sesión actual
   */
  updateActivity(): void {
    const session = this.getCurrentTabSession();
    if (session) {
      session.lastActivity = new Date();
      sessionStorage.setItem(this.TAB_SESSION_KEY, JSON.stringify(session));
      
      // También actualizar en sesiones globales
      this.updateGlobalSession(session.userId, session.userName, session.role, session.tabId);
    }
  }

  /**
   * Limpiar todas las sesiones (emergency cleanup)
   */
  clearAllSessions(): void {
    sessionStorage.removeItem(this.TAB_SESSION_KEY);
    localStorage.removeItem(this.GLOBAL_SESSIONS_KEY);
    this.currentTabSession.next(null);
    this.globalSessions.next([]);
    console.log('🧹 Todas las sesiones limpiadas');
  }
}