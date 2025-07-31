import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Client } from '../../../api/client';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-create-event',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './create-event.component.html',
  styleUrls: ['./create-event.component.css']
})
export class CreateEventComponent {
  private client = inject(Client);
  private router = inject(Router);
  private authService = inject(AuthService);
  
  currentUserId = this.authService.currentUserId; // TODO: Get from auth service
  eventTypes: any[] = [];
  loading = false;
  submitting = false;
  
  // Form data
  eventForm = {
    title: '',
    description: '',
    eventDate: '',
    registrationDeadline: '',
    locationName: '',
    maxParticipants: undefined as number | undefined,
    cost: undefined as number | undefined,
    currency: 'EUR',
    typeId: 0,
    additionalInfo: ''
  };

  ngOnInit() {
    this.loadEventTypes();
  }

  async loadEventTypes() {
    this.loading = true;
    try {
      const response = await this.client.active(1, 100, '', 'typeName', false).toPromise();
      this.eventTypes = response?.data?.items || [];
      if (this.eventTypes.length > 0) {
        this.eventForm.typeId = this.eventTypes[0].typeId;
      }
    } catch (error) {
      console.error('Error loading event types:', error);
    } finally {
      this.loading = false;
    }
  }

  async onSubmit() {
    if (!this.isFormValid()) {
      return;
    }

    this.submitting = true;
    try {
      const createEventDto = new (await import('../../../api/client')).CreateEventDto({
        title: this.eventForm.title,
        description: this.eventForm.description || undefined,
        eventDate: new Date(this.eventForm.eventDate),
        registrationDeadline: this.eventForm.registrationDeadline ? new Date(this.eventForm.registrationDeadline) : undefined,
        locationName: this.eventForm.locationName || '',
        maxParticipants: this.eventForm.maxParticipants,
        cost: this.eventForm.cost,
        currency: this.eventForm.currency || undefined,
        typeId: this.eventForm.typeId || 0,
        additionalInfo: this.eventForm.additionalInfo || undefined
      });

      const response = await this.client.eventsPOST(createEventDto).toPromise();
      
      if (response?.success && response.data?.eventId) {
        // Navigate to the created event
        this.router.navigate(['/events', response.data.eventId]);
      }
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Errore durante la creazione dell\'evento. Riprova.');
    } finally {
      this.submitting = false;
    }
  }

  isFormValid(): boolean {
    return !!(
      this.eventForm.title.trim() &&
      this.eventForm.eventDate
    );
  }

  goBack() {
    this.router.navigate(['/events']);
  }
} 