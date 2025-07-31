import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Client } from '../../api/client';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  private client = inject(Client);
  private authService = inject(AuthService);

  upcomingEvents: any[] = [];
  recentNotifications: any[] = [];
  friendsActivity: any[] = [];
  loading = true;

  ngOnInit() {
    this.loadDashboardData();
  }

  private async loadDashboardData() {
    if (!this.authService.currentUserId) {
      this.loading = false;
      return;
    }

    try {
      // Load upcoming events
      const eventsResponse = await this.client.upcoming(
        1, 5, '', 'eventDate', false, 
        undefined, undefined, undefined, undefined, 
        undefined, undefined, undefined, undefined, 
        false, 'Published'
      ).toPromise();
      this.upcomingEvents = eventsResponse?.data?.items || [];

      // Load recent notifications
      const notificationsResponse = await this.client.user3(
        this.authService.currentUserId, 1, 5, '', 'createdAt', true
      ).toPromise();
      this.recentNotifications = notificationsResponse?.data?.items || [];

      // Load friends' recent activity (upcoming events from friends)
      const friendsEventsResponse = await this.client.friends(
        this.authService.currentUserId, 1, 5, '', 'eventDate', false
      ).toPromise();
      this.friendsActivity = friendsEventsResponse?.data?.items || [];

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      this.loading = false;
    }
  }

  navigateToEvent(eventId: number) {
    window.location.href = `/events/${eventId}`;
  }

  markNotificationAsRead(notificationId: number) {
    if (!this.authService.currentUserId) return;
    
    this.client.read2(notificationId, this.authService.currentUserId).subscribe({
      next: () => {
        // Remove notification from the list
        this.recentNotifications = this.recentNotifications.filter(n => n.notificationId !== notificationId);
      },
      error: (error) => {
        console.error('Error marking notification as read:', error);
      }
    });
  }

  get currentUser() {
    return this.authService.currentUser;
  }

  get isAuthenticated() {
    return this.authService.isAuthenticated;
  }
} 