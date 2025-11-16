import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { initFlowbite } from 'flowbite';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';
import { TokenExpirationMonitorService } from './services/token-expiration-monitor.service';
import { Subscription } from 'rxjs';
import { NavbarComponent } from "./components/navbar/navbar.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [NavbarComponent, RouterOutlet, CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'ssmagt-frontend';
  showSidebar = true;

  private subs = new Subscription();
  private currentRole: number | null = null;

  constructor(
    private router: Router, 
    private auth: AuthService,
    private tokenMonitor: TokenExpirationMonitorService
  ) {
    // escuchar cambios de ruta y ocultar sidebar en páginas públicas
    this.subs.add(
      this.router.events.subscribe((ev) => {
        if (ev instanceof NavigationEnd) {
          this.showSidebar = !this.isPublicRoute(ev.urlAfterRedirects);
        }
      })
    );

    // suscribir cambios de usuario/rol para mostrar menú dinámico
    this.subs.add(
      this.auth.currentUser$.subscribe((user) => {
        this.currentRole = this.auth.getNormalizedRole();
        
        // Iniciar monitor de expiración cuando hay usuario autenticado
        if (user && this.currentRole) {
          this.tokenMonitor.iniciarMonitor();
        } else {
          this.tokenMonitor.detenerMonitor();
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    this.tokenMonitor.detenerMonitor();
  }

  // Método para determinar si una ruta es pública (sin sidebar)
  private isPublicRoute(url: string): boolean {
    const publicRoutes = ['/login', '/register'];
    return publicRoutes.includes(url);
  }

  isConsultor(): boolean {
    return this.currentRole === 4; // Rol 4 = Consultor
  }

  isCiudadano(): boolean {
    return this.currentRole === 1; // Rol 1 = Ciudadano
  }

  isMedico(): boolean {
    return this.currentRole === 2; // Rol 2 = Médico
  }

  isAdministrador(): boolean {
    return this.currentRole === 3; // Rol 3 = Administrador
  }

  ngOnInit(): void {
    initFlowbite();
    
    // Verificar si hay sesión activa al iniciar la aplicación
    if (this.auth.isAuthenticated()) {
      this.tokenMonitor.iniciarMonitor();
    }
    
    // inicializar currentRole con valor actual (si hay token)
    this.currentRole = this.auth.getNormalizedRole();
  }
}
