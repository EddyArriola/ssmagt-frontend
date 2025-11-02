import { Component, OnDestroy } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { initFlowbite } from 'flowbite';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';
import { Subscription } from 'rxjs';
import { NavbarComponent } from "./components/navbar/navbar.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [NavbarComponent, RouterOutlet, CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnDestroy {
  title = 'ssmagt-frontend';
  showSidebar = true;

  private subs = new Subscription();
  private currentRole: string | string[] | null = null;

  constructor(private router: Router, private auth: AuthService) {
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
      this.auth.currentUser$.subscribe(() => {
        this.currentRole = this.auth.getNormalizedRole();
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  // Método para determinar si una ruta es pública (sin sidebar)
  private isPublicRoute(url: string): boolean {
    const publicRoutes = ['/login', '/register'];
    return publicRoutes.includes(url);
  }

  isConsultor(): boolean {
    if (!this.currentRole) return false;
    if (Array.isArray(this.currentRole)) return this.currentRole.includes('consultor');
    return String(this.currentRole).toLowerCase() === 'consultor';
  }

  isCiudadano(): boolean {
    if (!this.currentRole) return false;
    if (Array.isArray(this.currentRole)) return this.currentRole.includes('ciudadano');
    return String(this.currentRole).toLowerCase() === 'ciudadano';
  }

  ngOnInit(): void {
    initFlowbite();
    // inicializar currentRole con valor actual (si hay token)
    this.currentRole = this.auth.getNormalizedRole();
  }
}
