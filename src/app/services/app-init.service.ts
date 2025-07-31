import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AppInitService {
  private authService = inject(AuthService);

  async initializeApp(): Promise<void> {
    // Ensure authentication state is properly loaded
    // The AuthService constructor already calls loadUserFromStorage()
    // but we can add additional initialization here if needed
    
    console.log('App initialization completed');
    console.log('Authentication state:', this.authService.isAuthenticated);
    console.log('Current user:', this.authService.currentUser);
  }
} 