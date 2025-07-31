import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Client, LoginDto, RegisterDto, UserDto } from '../api/client';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private client = inject(Client);
  private router = inject(Router);

  private currentUserSubject = new BehaviorSubject<UserDto | null>(null);
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);

  public currentUser$ = this.currentUserSubject.asObservable();
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor() {
    this.loadUserFromStorage();
  }

  // Get current user synchronously
  get currentUser(): UserDto | null {
    return this.currentUserSubject.value;
  }

  // Get current user ID
  get currentUserId(): number | null {
    return this.currentUser?.userId || null;
  }

  // Check if user is authenticated
  get isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  // Login method
  async login(emailOrUsername: string, password: string): Promise<{ success: boolean, message?: string }> {
    try {
      const loginDto = new LoginDto({
        emailOrUsername,
        password
      });

      const response = await this.client.login(loginDto).toPromise();

      if (response?.success && response.data) {
        console.log('🔐 Login successful, saving data...');
        
        // Save token and user data
        if (response.data.token) {
          localStorage.setItem('auth_token', response.data.token);
          console.log('💾 Token saved');
        }
        if (response.data.expiresAt) {
          localStorage.setItem('token_expires_at', response.data.expiresAt.toISOString());
          console.log('⏰ Expiration saved:', response.data.expiresAt);
        }
        if (response.data.user) {
          localStorage.setItem('current_user', JSON.stringify(response.data.user));
          this.currentUserSubject.next(response.data.user);
          console.log('👤 User data saved:', response.data.user);
        }

        this.isAuthenticatedSubject.next(true);
        console.log('✅ Authentication state updated');

        return { success: true };
      } else {
        return { success: false, message: response?.message || 'Login fallito' };
      }
    } catch (error: any) {
      console.error('Login error:', error);
      return { 
        success: false, 
        message: error?.message || 'Errore durante il login. Riprova.'
      };
    }
  }

  // Register method
  async register(userData: {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
    firstName: string;
    lastName: string;
    bio?: string;
    phoneNumber?: string;
    dateOfBirth?: Date;
  }): Promise<{ success: boolean, message?: string }> {
    try {
      const registerDto = new RegisterDto({
        username: userData.username,
        email: userData.email,
        password: userData.password,
        confirmPassword: userData.confirmPassword,
        firstName: userData.firstName,
        lastName: userData.lastName,
        bio: userData.bio,
        phoneNumber: userData.phoneNumber,
        dateOfBirth: userData.dateOfBirth
      });

      const response = await this.client.register(registerDto).toPromise();

      if (response?.success && response.data) {
        // Auto-login after successful registration
        if (response.data.token) {
          localStorage.setItem('auth_token', response.data.token);
        }
        if (response.data.expiresAt) {
          localStorage.setItem('token_expires_at', response.data.expiresAt.toISOString());
        }
        if (response.data.user) {
          localStorage.setItem('current_user', JSON.stringify(response.data.user));
          this.currentUserSubject.next(response.data.user);
        }

        this.isAuthenticatedSubject.next(true);

        return { success: true };
      } else {
        return { 
          success: false, 
          message: response?.message || 'Registrazione fallita' 
        };
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      return { 
        success: false, 
        message: error?.message || 'Errore durante la registrazione. Riprova.' 
      };
    }
  }

  // Logout method
  async logout(): Promise<void> {
    try {
      // Call logout API if needed
      await this.client.logout().toPromise();
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      // Clear local storage and state
      this.clearAuthData();
      this.router.navigate(['/login']);
    }
  }

  // Load user profile
  async loadUserProfile(): Promise<void> {
    if (!this.isAuthenticated) return;

    try {
      const response = await this.client.me().toPromise();
      if (response?.success && response.data) {
        const user = UserDto.fromJS(response.data);
        localStorage.setItem('current_user', JSON.stringify(user));
        this.currentUserSubject.next(user);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      // If token is invalid, logout
      this.clearAuthData();
    }
  }

  // Check username availability
  async checkUsername(username: string): Promise<boolean> {
    try {
      const response = await this.client.checkUsername(username).toPromise();
      return response?.data || false; // true = available, false = taken
    } catch (error) {
      console.error('Error checking username:', error);
      return false;
    }
  }

  // Check email availability
  async checkEmail(email: string): Promise<boolean> {
    try {
      const response = await this.client.checkEmail(email).toPromise();
      return response?.data || false; // true = available, false = taken
    } catch (error) {
      console.error('Error checking email:', error);
      return false;
    }
  }

  // Get auth token
  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  // Check if token is expired
  isTokenExpired(): boolean {
    const expiresAt = localStorage.getItem('token_expires_at');
    if (!expiresAt) return true;

    const expirationDate = new Date(expiresAt);
    const now = new Date();
    
    return now >= expirationDate;
  }

  // Clear auth data
  private clearAuthData(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('token_expires_at');
    localStorage.removeItem('current_user');
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }

  // Load user from storage on app init
  private loadUserFromStorage(): void {
    console.log('🔍 Loading user from storage...');
    
    const token = localStorage.getItem('auth_token');
    const userJson = localStorage.getItem('current_user');
    const expiresAt = localStorage.getItem('token_expires_at');

    console.log('📦 Stored data:', {
      hasToken: !!token,
      hasUser: !!userJson,
      hasExpiresAt: !!expiresAt,
      isExpired: this.isTokenExpired()
    });

    if (token && userJson && !this.isTokenExpired()) {
      try {
        const user = JSON.parse(userJson);
        console.log('✅ User data loaded successfully:', user);
        
        this.currentUserSubject.next(UserDto.fromJS(user));
        this.isAuthenticatedSubject.next(true);
        
        console.log('🔐 Authentication state restored');
        
        // Silently refresh user profile in background (don't logout on error)
        this.loadUserProfileSilently();
      } catch (error) {
        console.error('❌ Error parsing stored user data:', error);
        this.clearAuthData();
      }
    } else {
      console.log('❌ No valid authentication data found, clearing...');
      this.clearAuthData();
    }
  }

  // Load user profile silently (don't logout on error)
  private async loadUserProfileSilently(): Promise<void> {
    if (!this.isAuthenticated) return;

    try {
      const response = await this.client.me().toPromise();
      if (response?.success && response.data) {
        const user = UserDto.fromJS(response.data);
        localStorage.setItem('current_user', JSON.stringify(user));
        this.currentUserSubject.next(user);
      }
    } catch (error) {
      console.error('Error loading user profile (silent):', error);
      // Don't logout on network errors, just keep the stored user data
    }
  }
} 