import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  constructor(private auth: AuthService) {}

  logout(): void {
    this.auth.logout();
  }

  isConsultor(): boolean {
    const r = this.auth.getNormalizedRole();
    if (!r) return false;
    if (Array.isArray(r)) return r.includes('consultor');
    return String(r).toLowerCase() === 'consultor';
  }

  isCiudadano(): boolean {
    const r = this.auth.getNormalizedRole();
    if (!r) return false;
    if (Array.isArray(r)) return r.includes('ciudadano');
    return String(r).toLowerCase() === 'ciudadano';
  }

  isMedico(): boolean {
    const r = this.auth.getNormalizedRole();
    if (!r) return false;
    if (Array.isArray(r)) return r.includes('medico');
    return String(r).toLowerCase() === 'medico';
  }

  isAdministrador(): boolean {
    const r = this.auth.getNormalizedRole();
    if (!r) return false;
    if (Array.isArray(r)) return r.includes('administrador');
    return String(r).toLowerCase() === 'administrador';
  }
}
