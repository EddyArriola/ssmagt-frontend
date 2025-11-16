import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { UsuarioService } from '../../../services/usuario.service';
import { AuthService } from '../../../services/auth.service';
import { UpdateUsuarioDto, Usuario, UsuarioFormErrors } from '../../../interfaces/usuario';

@Component({
  selector: 'app-actualizar-datos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './actualizar-datos.component.html',
  styleUrl: './actualizar-datos.component.css'
})
export class ActualizarDatosComponent implements OnInit {
  userForm: FormGroup;
  formErrors: UsuarioFormErrors = {};
  isSubmitting = false;
  submitSuccess = false;
  submitError = '';
  isLoading = true;
  currentUser: Usuario | null = null;
  userId: number = 0;

  constructor(
    private fb: FormBuilder,
    private usuarioService: UsuarioService,
    private authService: AuthService,
    private router: Router
  ) {
    this.userForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadCurrentUser();
    this.setupFormValidation();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      nombres: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      apellidos: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      cui: [{ value: '', disabled: true }], // CUI no se puede modificar
      fecha_nacimiento: ['', [Validators.required]],
      direccion: ['', [Validators.maxLength(200)]],
      telefono: ['', [Validators.pattern(/^\d{8,15}$/)]],
      email: [{ value: '', disabled: true }], // Email no se puede modificar 
      ocupacion: ['', [Validators.maxLength(100)]]
      // No incluir campos de contraseña ya que no se pueden modificar aquí
    });
  }

  private async loadCurrentUser(): Promise<void> {
    try {
      this.isLoading = true;
      
      // Obtener ID del usuario del token
      const userId = this.authService.getUserId();
      console.log('🔍 ActualizarDatos - UserId obtenido:', userId);
      
      if (!userId) {
        console.error('❌ No se pudo obtener el userId del token');
        this.router.navigate(['/login']);
        return;
      }

      this.userId = Number(userId);
      
      // Debug: Verificar rol y token
      const role = this.authService.getNormalizedRole();
      const tokenInfo = this.authService.getTokenInfo();
      console.log('🔍 ActualizarDatos - Rol del usuario:', role);
      console.log('🔍 ActualizarDatos - Info del token:', tokenInfo);

      // Cargar datos del usuario
      console.log('📡 ActualizarDatos - Cargando datos del usuario ID:', this.userId);
      this.currentUser = await this.usuarioService.getUsuarioById(this.userId).toPromise() || null;
      
      if (this.currentUser) {
        console.log('✅ ActualizarDatos - Datos del usuario cargados:', this.currentUser);
        // Prellenar el formulario con los datos actuales
        this.userForm.patchValue({
          nombres: this.currentUser.nombres,
          apellidos: this.currentUser.apellidos,
          cui: this.currentUser.cui,
          fecha_nacimiento: this.formatDateForInput(this.currentUser.fecha_nacimiento),
          direccion: this.currentUser.direccion || '',
          telefono: this.currentUser.telefono || '',
          email: this.currentUser.email || '',
          ocupacion: this.currentUser.ocupacion || ''
        });
      } else {
        console.error('❌ ActualizarDatos - No se pudieron cargar los datos del usuario');
      }
    } catch (error: any) {
      console.error('❌ ActualizarDatos - Error al cargar datos del usuario:', error);
      
      if (error?.status === 403) {
        this.submitError = 'No tienes permisos para acceder a tus datos. Contacta al administrador.';
        console.error('🚫 Error 403: El rol consultor podría no tener permisos para este endpoint');
      } else if (error?.status === 401) {
        this.submitError = 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
        this.router.navigate(['/login']);
      } else if (error?.status === 404) {
        this.submitError = 'No se encontraron tus datos de usuario.';
      } else {
        this.submitError = 'Error al cargar los datos del usuario. Inténtalo más tarde.';
      }
    } finally {
      this.isLoading = false;
    }
  }

  private formatDateForInput(date: Date | string): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }

  private setupFormValidation(): void {
    // Validación en tiempo real
    this.userForm.valueChanges.subscribe(() => {
      this.validateForm();
    });
  }

  private validateForm(): void {
    this.formErrors = {};
    
    const controls = this.userForm.controls;
    
    // Validar nombres
    if (controls['nombres'].invalid && controls['nombres'].touched) {
      if (controls['nombres'].hasError('required')) {
        this.formErrors.nombres = 'Los nombres son obligatorios';
      } else if (controls['nombres'].hasError('minlength')) {
        this.formErrors.nombres = 'Los nombres deben tener al menos 2 caracteres';
      } else if (controls['nombres'].hasError('maxlength')) {
        this.formErrors.nombres = 'Los nombres no pueden tener más de 50 caracteres';
      }
    }

    // Validar apellidos
    if (controls['apellidos'].invalid && controls['apellidos'].touched) {
      if (controls['apellidos'].hasError('required')) {
        this.formErrors.apellidos = 'Los apellidos son obligatorios';
      } else if (controls['apellidos'].hasError('minlength')) {
        this.formErrors.apellidos = 'Los apellidos deben tener al menos 2 caracteres';
      } else if (controls['apellidos'].hasError('maxlength')) {
        this.formErrors.apellidos = 'Los apellidos no pueden tener más de 50 caracteres';
      }
    }

    // Validar fecha de nacimiento
    if (controls['fecha_nacimiento'].invalid && controls['fecha_nacimiento'].touched) {
      if (controls['fecha_nacimiento'].hasError('required')) {
        this.formErrors.fecha_nacimiento = 'La fecha de nacimiento es obligatoria';
      }
    }

    // Validar teléfono
    if (controls['telefono'].invalid && controls['telefono'].touched) {
      if (controls['telefono'].hasError('pattern')) {
        this.formErrors.telefono = 'El teléfono debe contener entre 8 y 15 dígitos';
      }
    }
  }

  async onSubmit(): Promise<void> {
    if (this.userForm.invalid) {
      this.markAllFieldsAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.submitError = '';

    try {
      // Preparar datos para envío (solo los campos que se pueden modificar)
      const userData: UpdateUsuarioDto = {
        nombres: this.userForm.value.nombres.trim(),
        apellidos: this.userForm.value.apellidos.trim(),
        fecha_nacimiento: new Date(this.userForm.value.fecha_nacimiento + 'T00:00:00.000Z'),
        direccion: this.userForm.value.direccion?.trim() || undefined,
        telefono: this.userForm.value.telefono || undefined,
        ocupacion: this.userForm.value.ocupacion?.trim() || undefined
      };

      // Log para verificar los datos que se envían
      console.log('🔄 Datos que se actualizarán:', JSON.stringify(userData, null, 2));
      console.log('👤 ID del usuario:', this.userId);

      // Actualizar usuario
      const response = await this.usuarioService.actualizarUsuario(this.userId, userData).toPromise();
      console.log('✅ Usuario actualizado exitosamente:', response);
      
      this.submitSuccess = true;
      
      // Redirigir después de 2 segundos
      setTimeout(() => {
        this.router.navigate(['/inicioCiudadano']);
      }, 2000);

    } catch (error: any) {
      console.error('Error al actualizar usuario:', error);
      
      // Manejar errores específicos del backend
      if (error.status === 400) {
        const errorMessage = error.error?.message || error.error?.error || 'Error de validación';
        this.submitError = errorMessage;
      } else if (error.status === 404) {
        this.submitError = 'Usuario no encontrado';
      } else if (error.status === 500) {
        console.error('🔥 ERROR 500 - DETALLES COMPLETOS:');
        console.error('📊 Status:', error.status);
        console.error('📝 Error del backend:', error.error);
        console.error('🌐 URL:', error.url);
        this.submitError = 'Error interno del servidor. Por favor, intente nuevamente.';
      } else {
        this.submitError = error.error?.message || error.message || 'Error al actualizar los datos. Por favor, intente nuevamente.';
      }
    } finally {
      this.isSubmitting = false;
    }
  }

  private markAllFieldsAsTouched(): void {
    Object.keys(this.userForm.controls).forEach(key => {
      this.userForm.get(key)?.markAsTouched();
    });
    this.validateForm();
  }

  // Método para cancelar y volver
  onCancel(): void {
    this.router.navigate(['/inicioCiudadano']);
  }

  // Método para limpiar formulario (restaurar datos originales)
  resetForm(): void {
    if (this.currentUser) {
      this.userForm.patchValue({
        nombres: this.currentUser.nombres,
        apellidos: this.currentUser.apellidos,
        fecha_nacimiento: this.formatDateForInput(this.currentUser.fecha_nacimiento),
        direccion: this.currentUser.direccion || '',
        telefono: this.currentUser.telefono || '',
        ocupacion: this.currentUser.ocupacion || ''
      });
    }
    this.formErrors = {};
    this.submitError = '';
    this.submitSuccess = false;
  }
}
