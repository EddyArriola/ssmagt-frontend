import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { UsuarioService } from '../services/usuario.service';
import { CreateUsuarioDto, UsuarioFormErrors } from '../interfaces/usuario';

@Component({
  selector: 'app-create-user',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './create-user.component.html',
  styleUrl: './create-user.component.css'
})
export class CreateUserComponent implements OnInit {
  userForm: FormGroup;
  formErrors: UsuarioFormErrors = {};
  isSubmitting = false;
  submitSuccess = false;
  submitError = '';

  constructor(
    private fb: FormBuilder,
    private usuarioService: UsuarioService,
    private router: Router
  ) {
    this.userForm = this.createForm();
  }

  ngOnInit(): void {
    this.setupFormValidation();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      nombres: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      apellidos: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      cui: ['', [Validators.required, Validators.pattern(/^\d{4}-?\d{5}-?\d{4}$/)]],
      fecha_nacimiento: ['', [Validators.required]],
      direccion: ['', [Validators.maxLength(200)]],
      telefono: ['', [Validators.pattern(/^\d{8,15}$/)]],
      email: ['', [Validators.email, Validators.maxLength(100)]],
      ocupacion: ['', [Validators.maxLength(100)]],
      password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(50)]],
      confirmPassword: ['', [Validators.required]]
    }, { 
      validators: this.passwordMatchValidator 
    });
  }

  private setupFormValidation(): void {
    // Validación en tiempo real
    this.userForm.valueChanges.subscribe(() => {
      this.validateForm();
    });
  }

  private passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    if (confirmPassword?.hasError('passwordMismatch')) {
      delete confirmPassword.errors!['passwordMismatch'];
      if (Object.keys(confirmPassword.errors!).length === 0) {
        confirmPassword.setErrors(null);
      }
    }
    
    return null;
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

    // Validar CUI
    if (controls['cui'].invalid && controls['cui'].touched) {
      if (controls['cui'].hasError('required')) {
        this.formErrors.cui = 'El CUI es obligatorio';
      } else if (controls['cui'].hasError('pattern')) {
        this.formErrors.cui = 'El CUI debe tener el formato: 1234-56789-1234';
      }
    }

    // Validar fecha de nacimiento
    if (controls['fecha_nacimiento'].invalid && controls['fecha_nacimiento'].touched) {
      if (controls['fecha_nacimiento'].hasError('required')) {
        this.formErrors.fecha_nacimiento = 'La fecha de nacimiento es obligatoria';
      }
    }

    // Validar email
    if (controls['email'].invalid && controls['email'].touched) {
      if (controls['email'].hasError('email')) {
        this.formErrors.email = 'El formato del email no es válido';
      } else if (controls['email'].hasError('maxlength')) {
        this.formErrors.email = 'El email no puede tener más de 100 caracteres';
      }
    }

    // Validar teléfono
    if (controls['telefono'].invalid && controls['telefono'].touched) {
      if (controls['telefono'].hasError('pattern')) {
        this.formErrors.telefono = 'El teléfono debe contener entre 8 y 15 dígitos';
      }
    }

    // Validar contraseña
    if (controls['password'].invalid && controls['password'].touched) {
      if (controls['password'].hasError('required')) {
        this.formErrors.password = 'La contraseña es obligatoria';
      } else if (controls['password'].hasError('minlength')) {
        this.formErrors.password = 'La contraseña debe tener al menos 6 caracteres';
      } else if (controls['password'].hasError('maxlength')) {
        this.formErrors.password = 'La contraseña no puede tener más de 50 caracteres';
      }
    }

    // Validar confirmación de contraseña
    if (controls['confirmPassword'].invalid && controls['confirmPassword'].touched) {
      if (controls['confirmPassword'].hasError('required')) {
        this.formErrors.confirmPassword = 'Debe confirmar la contraseña';
      } else if (controls['confirmPassword'].hasError('passwordMismatch')) {
        this.formErrors.confirmPassword = 'Las contraseñas no coinciden';
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
      // TODO: Verificar CUI duplicado cuando el backend implemente el endpoint
      // const cuiExists = await this.usuarioService.verificarCUI(this.userForm.value.cui).toPromise();
      // if (cuiExists?.existe) {
      //   this.formErrors.cui = 'Este CUI ya está registrado';
      //   this.isSubmitting = false;
      //   return;
      // }

      // TODO: Verificar email duplicado cuando el backend implemente el endpoint
      // if (this.userForm.value.email) {
      //   const emailExists = await this.usuarioService.verificarEmail(this.userForm.value.email).toPromise();
      //   if (emailExists?.existe) {
      //     this.formErrors.email = 'Este email ya está registrado';
      //     this.isSubmitting = false;
      //     return;
      //   }
      // }

      // Preparar datos para envío
      const userData: CreateUsuarioDto = {
        nombres: this.userForm.value.nombres.trim(),
        apellidos: this.userForm.value.apellidos.trim(),
        cui: this.userForm.value.cui.replace(/-/g, ''), // Remover guiones del CUI
        fecha_nacimiento: new Date(this.userForm.value.fecha_nacimiento + 'T00:00:00.000Z').toISOString(),
        direccion: this.userForm.value.direccion?.trim() || undefined,
        telefono: this.userForm.value.telefono || undefined,
        email: this.userForm.value.email?.trim() || undefined,
        ocupacion: this.userForm.value.ocupacion?.trim() || undefined,
        password: this.userForm.value.password
        // El backend asignará automáticamente el rol de ciudadano por defecto
      };

      // Log para verificar los datos que se envían
      console.log('🚀 Datos que se envían al backend:', JSON.stringify(userData, null, 2));
      console.log('🔍 Verificando estructura del objeto:', Object.keys(userData));

      // Crear usuario
      const response = await this.usuarioService.crearUsuario(userData).toPromise();
      console.log('✅ Usuario creado exitosamente:', response);
      
      this.submitSuccess = true;
      this.userForm.reset();
      
      // Redirigir después de 2 segundos
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 2000);

    } catch (error: any) {
      console.error('Error al crear usuario:', error);
      
      // Manejar errores específicos del backend
      if (error.status === 400) {
        const errorMessage = error.error?.message || error.error?.error || 'Error de validación';
        
        // Verificar si es error de CUI duplicado
        if (errorMessage.toLowerCase().includes('cui') && errorMessage.toLowerCase().includes('existe')) {
          this.formErrors.cui = 'Este CUI ya está registrado en el sistema';
        }
        // Verificar si es error de email duplicado
        else if (errorMessage.toLowerCase().includes('email') && errorMessage.toLowerCase().includes('existe')) {
          this.formErrors.email = 'Este email ya está registrado en el sistema';
        }
        // Error general de validación
        else {
          this.submitError = errorMessage;
        }
      } else if (error.status === 409) {
        // Conflicto - recurso ya existe
        this.submitError = 'Los datos proporcionados ya están registrados en el sistema';
      } else if (error.status === 500) {
        // Error interno del servidor
        console.error('🔥 ERROR 500 - DETALLES COMPLETOS:');
        console.error('📊 Status:', error.status);
        console.error('📝 Error del backend:', error.error);
        console.error('🌐 URL:', error.url);
        console.error('📄 Response completo:', error);
        this.submitError = 'Error interno del servidor. Revisa los logs del backend para más información.';
      } else {
        // Otros errores
        this.submitError = error.error?.message || error.message || 'Error al crear el usuario. Por favor, intente nuevamente.';
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

  // Método para formatear CUI mientras el usuario escribe
  onCuiInput(event: any): void {
    let value = event.target.value.replace(/\D/g, ''); // Solo números
    
    if (value.length >= 4) {
      value = value.substring(0, 4) + '-' + value.substring(4);
    }
    if (value.length >= 10) {
      value = value.substring(0, 10) + '-' + value.substring(10, 14);
    }
    
    this.userForm.patchValue({ cui: value });
  }

  // Método para limpiar formulario
  resetForm(): void {
    this.userForm.reset();
    this.formErrors = {};
    this.submitError = '';
    this.submitSuccess = false;
  }
}
