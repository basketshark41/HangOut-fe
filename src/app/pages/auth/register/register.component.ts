import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  registerForm: FormGroup;
  loading = false;
  errorMessage = '';
  showPassword = false;
  showConfirmPassword = false;
  
  // Availability checks
  checkingUsername = false;
  checkingEmail = false;
  usernameAvailable = true;
  emailAvailable = true;

  constructor() {
    this.registerForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(20), this.usernameValidator]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6), this.passwordValidator]],
      confirmPassword: ['', [Validators.required]],
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      bio: ['', [Validators.maxLength(500)]],
      phoneNumber: ['', [this.phoneValidator]],
      dateOfBirth: [''],
      acceptTerms: [false, [Validators.requiredTrue]]
    }, { validators: this.passwordMatchValidator });

    // Setup real-time availability checks
    this.setupAvailabilityChecks();

    // Redirect if already authenticated
    if (this.authService.isAuthenticated) {
      this.router.navigate(['/']);
    }
  }

  // Custom validators
  private usernameValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;

    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(value)) {
      return { invalidUsername: true };
    }

    return null;
  }

  private passwordValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;

    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumeric = /[0-9]/.test(value);

    if (!hasUpperCase || !hasLowerCase || !hasNumeric) {
      return { weakPassword: true };
    }

    return null;
  }

  private phoneValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;

    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{8,}$/;
    if (!phoneRegex.test(value)) {
      return { invalidPhone: true };
    }

    return null;
  }

  private passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const password = group.get('password');
    const confirmPassword = group.get('confirmPassword');

    if (!password || !confirmPassword) return null;

    return password.value === confirmPassword.value ? null : { passwordMismatch: true };
  }

  // Setup availability checks with debouncing
  private setupAvailabilityChecks() {
    // Username availability check
    this.registerForm.get('username')?.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(async (username) => {
      if (username && username.length >= 3 && !this.registerForm.get('username')?.hasError('invalidUsername')) {
        this.checkingUsername = true;
        this.usernameAvailable = await this.authService.checkUsername(username);
        this.checkingUsername = false;
      }
    });

    // Email availability check
    this.registerForm.get('email')?.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(async (email) => {
      if (email && !this.registerForm.get('email')?.hasError('email')) {
        this.checkingEmail = true;
        this.emailAvailable = await this.authService.checkEmail(email);
        this.checkingEmail = false;
      }
    });
  }

  async onSubmit() {
    if (this.registerForm.invalid || !this.usernameAvailable || !this.emailAvailable) {
      this.markFormGroupTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const formValue = this.registerForm.value;

    try {
      const result = await this.authService.register({
        username: formValue.username,
        email: formValue.email,
        password: formValue.password,
        confirmPassword: formValue.confirmPassword,
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        bio: formValue.bio || undefined,
        phoneNumber: formValue.phoneNumber || undefined,
        dateOfBirth: formValue.dateOfBirth ? new Date(formValue.dateOfBirth) : undefined
      });

      if (result.success) {
        // Redirect to home after successful registration
        this.router.navigate(['/']);
      } else {
        this.errorMessage = result.message || 'Registrazione fallita. Riprova.';
      }
    } catch (error) {
      this.errorMessage = 'Errore di connessione. Riprova più tardi.';
    } finally {
      this.loading = false;
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  private markFormGroupTouched() {
    Object.keys(this.registerForm.controls).forEach(key => {
      const control = this.registerForm.get(key);
      control?.markAsTouched();
    });
  }

  // Helper methods for template
  isFieldInvalid(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.registerForm.get(fieldName);
    if (field && field.errors && field.touched) {
      if (field.errors['required']) {
        return this.getRequiredMessage(fieldName);
      }
      if (field.errors['email']) {
        return 'Inserisci un indirizzo email valido';
      }
      if (field.errors['minlength']) {
        return this.getMinLengthMessage(fieldName, field.errors['minlength'].requiredLength);
      }
      if (field.errors['maxlength']) {
        return this.getMaxLengthMessage(fieldName, field.errors['maxlength'].requiredLength);
      }
      if (field.errors['invalidUsername']) {
        return 'Username può contenere solo lettere, numeri e underscore';
      }
      if (field.errors['weakPassword']) {
        return 'Password deve contenere almeno una maiuscola, una minuscola e un numero';
      }
      if (field.errors['invalidPhone']) {
        return 'Inserisci un numero di telefono valido';
      }
      if (field.errors['requiredTrue']) {
        return 'Devi accettare i termini e condizioni';
      }
    }

    // Form-level errors
    if (fieldName === 'confirmPassword' && this.registerForm.errors?.['passwordMismatch']) {
      return 'Le password non corrispondono';
    }

    return '';
  }

  private getRequiredMessage(fieldName: string): string {
    const messages: { [key: string]: string } = {
      username: 'Username richiesto',
      email: 'Email richiesta',
      password: 'Password richiesta',
      confirmPassword: 'Conferma password richiesta',
      firstName: 'Nome richiesto',
      lastName: 'Cognome richiesto',
      acceptTerms: 'Devi accettare i termini e condizioni'
    };
    return messages[fieldName] || `${fieldName} richiesto`;
  }

  private getMinLengthMessage(fieldName: string, requiredLength: number): string {
    const messages: { [key: string]: string } = {
      username: `Username deve essere di almeno ${requiredLength} caratteri`,
      password: `Password deve essere di almeno ${requiredLength} caratteri`,
      firstName: `Nome deve essere di almeno ${requiredLength} caratteri`,
      lastName: `Cognome deve essere di almeno ${requiredLength} caratteri`
    };
    return messages[fieldName] || `Minimo ${requiredLength} caratteri`;
  }

  private getMaxLengthMessage(fieldName: string, maxLength: number): string {
    const messages: { [key: string]: string } = {
      username: `Username non può superare ${maxLength} caratteri`,
      bio: `Biografia non può superare ${maxLength} caratteri`
    };
    return messages[fieldName] || `Massimo ${maxLength} caratteri`;
  }

  // Availability status helpers
  getUsernameStatus(): 'checking' | 'available' | 'taken' | null {
    const usernameControl = this.registerForm.get('username');
    if (!usernameControl?.value || usernameControl.hasError('required') || usernameControl.hasError('invalidUsername') || usernameControl.hasError('minlength')) {
      return null;
    }
    if (this.checkingUsername) return 'checking';
    return this.usernameAvailable ? 'available' : 'taken';
  }

  getEmailStatus(): 'checking' | 'available' | 'taken' | null {
    const emailControl = this.registerForm.get('email');
    if (!emailControl?.value || emailControl.hasError('required') || emailControl.hasError('email')) {
      return null;
    }
    if (this.checkingEmail) return 'checking';
    return this.emailAvailable ? 'available' : 'taken';
  }
} 