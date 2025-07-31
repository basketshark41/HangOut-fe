import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { Client } from '../../../api/client';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './event-detail.component.html',
  styleUrls: ['./event-detail.component.css']
})
export class EventDetailComponent implements OnInit {
  private client = inject(Client);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);

  event: any = null;
  loading = false;
  errorMessage = '';
  eventId: number = 0;

  constructor() {
    this.eventId = Number(this.route.snapshot.paramMap.get('id'));
  }

  ngOnInit() {
    if (!this.eventId) {
      this.router.navigate(['/events']);
      return;
    }

    this.loadEvent();
  }

  async loadEvent() {
    this.loading = true;
    try {
      const response = await this.client.eventsGET(this.eventId, this.authService.currentUserId || undefined).toPromise();
      
      if (response?.success && response.data) {
        this.event = response.data;
      } else {
        this.errorMessage = 'Evento non trovato';
      }
    } catch (error) {
      console.error('Error loading event:', error);
      this.errorMessage = 'Errore nel caricamento dell\'evento';
    } finally {
      this.loading = false;
    }
  }

  get isEventCreator(): boolean {
    return this.event?.creatorId === this.authService.currentUserId;
  }

  get isAuthenticated(): boolean {
    return this.authService.isAuthenticated;
  }

  get statusClass(): string {
    if (!this.event) return '';
    return this.event.status?.toLowerCase() || 'draft';
  }

  get statusText(): string {
    if (!this.event) return '';
    switch (this.event.status) {
      case 'Published': return 'Pubblicato';
      case 'Draft': return 'Bozza';
      case 'Cancelled': return 'Cancellato';
      default: return this.event.status || 'Bozza';
    }
  }

  formatDate(date: string | Date): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('it-IT', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatCost(cost: number, currency: string = 'EUR'): string {
    if (!cost || cost === 0) return 'Gratuito';
    return `${cost} ${currency}`;
  }
} 