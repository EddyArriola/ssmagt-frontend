import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  // Campos del formulario
  cui: string = '';
  password: string = '';

  // Estado del formulario
  showPassword: boolean = false;
  loading: boolean = false;
  error: string | null = null;

  constructor(private router: Router, private auth: AuthService) {}

  // Método ejecutado al enviar el formulario
  submit() {
    // Reiniciar errores y activar el indicador de carga
    this.error = null;
    this.loading = true;

    // URL del endpoint del backend
    // Usar AuthService para centralizar lógica de login
    this.auth.login(this.cui, this.password).subscribe({
      next: (res) => {
        this.loading = false;
        const token = res?.access_token ?? res?.token ?? this.auth.getToken();
        if (token) {
          // opcional: decodificar payload para uso inmediato durante debugging
          const payload = this.parseJwt(token);
          console.log('JWT payload:', payload);

          // limpiar password por seguridad
          this.password = '';

          // Determinar rol (normalizado a string(s)) y navegar según mapa
          const role = this.auth.getNormalizedRole();
          const target = this.mapRoleToRoute(role);
          this.router.navigate([target]);
        } else {
          this.error = 'Respuesta inesperada del servidor';
        }
      },
      error: (err) => {
        this.loading = false;
        this.password = '';
        if (err?.status === 401) {
          this.error = err?.error?.message ?? 'Credenciales inválidas';
        } else if (err?.error?.message) {
          this.error = err.error.message;
        } else {
          this.error = 'Error de autenticación';
        }
      }
    });
  }

  // Alterna visibilidad de la contraseña
  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  /**
   * Mapea rol(es) (incluyendo los nombres en español que devuelve `roleName`) a una ruta de la aplicación.
   * Acepta también variantes en inglés como compatibilidad.
   */
  private mapRoleToRoute(role: string | string[] | null): string {
    // prioridad: administrador > medico > ciudadano > consultor
    const priorityVariants = [
      ['administrador', 'admin'],
      ['medico', 'manager', 'medic'],
      ['ciudadano', 'user', 'cliente'],
      ['consultor', 'consultant']
    ];

    if (!role) return '/';

    const roleList = Array.isArray(role) ? role.map(r => String(r).toLowerCase()) : [String(role).toLowerCase()];

    // Buscar por prioridad
    for (const variants of priorityVariants) {
      for (const v of variants) {
        if (roleList.includes(v)) return this.routeFor(variants[0]);
      }
    }

    // Si ninguno coincide, intentar usar el primer elemento del array si existe
    if (roleList.length) return this.routeFor(roleList[0]);

    return '/';
  }

  private routeFor(p: string | undefined): string {
    switch ((p || '').toLowerCase()) {
      case 'administrador':
        return '/admin';
      case 'medico':
        return '/inicio-medico';
      case 'ciudadano':
        return '/inicioCiudadano';
      case 'consultor':
        return '/consultor';
      // English fallbacks
      case 'admin':
        return '/admin';
      case 'manager':
      case 'medic':
        return '/inicio-medico';
      case 'user':
        return '/inicioCiudadano';
      case 'consultant':
        return '/consultor';
      default:
        return '/';
    }
  }

  // Decodifica el payload del JWT (no valida firma)
  private parseJwt(token: string): any {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const payload = parts[1];
      const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decodeURIComponent(escape(json)));
    } catch (e) {
      return null;
    }
  }
}
