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
    const role = this.auth.getNormalizedRole();
    console.log('🔍 Navbar - isConsultor() - Role:', role);
    return role === 4; // Rol 4 = Consultor
  }

  isCiudadano(): boolean {
    const role = this.auth.getNormalizedRole();
    console.log('🔍 Navbar - isCiudadano() - Role:', role);
    return role === 1; // Rol 1 = Ciudadano
  }

  isMedico(): boolean {
    const role = this.auth.getNormalizedRole();
    console.log('🔍 Navbar - isMedico() - Role:', role);
    return role === 2; // Rol 2 = Médico
  }

  isAdministrador(): boolean {
    const role = this.auth.getNormalizedRole();
    console.log('🔍 Navbar - isAdministrador() - Role:', role);
    return role === 3; // Rol 3 = Administrador
  }
}
