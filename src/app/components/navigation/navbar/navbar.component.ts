import { Component, OnInit, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Client } from '../../../api/client';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  private client = inject(Client);
  private router = inject(Router);
  private authService = inject(AuthService);
  
  currentUser: any = null;
  notificationSummary: any = null;
  isProfileMenuOpen = false;
  isMobileMenuOpen = false;
  isAuthenticated = false;
  
  ngOnInit() {
    // Subscribe to authentication state
    this.authService.isAuthenticated$.subscribe(isAuth => {
      this.isAuthenticated = isAuth;
      if (isAuth) {
        this.loadNotificationSummary();
      } else {
        this.notificationSummary = null;
      }
    });

    // Subscribe to current user
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  async loadNotificationSummary() {
    if (!this.authService.currentUserId) return;
    
    try {
      const response = await this.client.summary(this.authService.currentUserId).toPromise();
      this.notificationSummary = response?.data;
    } catch (error) {
      console.error('Error loading notification summary:', error);
    }
  }

  toggleProfileMenu() {
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
  }

  closeProfileMenu() {
    this.isProfileMenuOpen = false;
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu() {
    this.isMobileMenuOpen = false;
  }

  closeAllMenus() {
    this.isProfileMenuOpen = false;
    this.isMobileMenuOpen = false;
  }

  navigateToProfile() {
    this.router.navigate(['/profile']);
    this.closeAllMenus();
  }

  async logout() {
    await this.authService.logout();
    this.closeAllMenus();
  }

  get unreadNotificationsCount(): number {
    return this.notificationSummary?.unreadCount || 0;
  }

  get hasUnreadMessages(): boolean {
    return this.notificationSummary?.hasUnreadMessages || false;
  }

  get hasUnreadFriendRequests(): boolean {
    return this.notificationSummary?.hasUnreadFriendRequests || false;
  }

  // Close menus when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    const navbar = target.closest('.navbar');
    if (!navbar) {
      this.closeAllMenus();
    }
  }
} 