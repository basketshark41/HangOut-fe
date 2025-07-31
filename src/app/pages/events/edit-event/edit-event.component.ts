import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { Client, UpdateEventDto } from '../../../api/client';
import { AuthService } from '../../../services/auth.service';


@Component({
  selector: 'app-edit-event',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './edit-event.component.html',
  styleUrls: ['./edit-event.component.css']
})
export class EditEventComponent implements OnInit {
  private client = inject(Client);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  editForm: FormGroup;
  event: any = null;
  eventTypes: any[] = [];
  loading = false;
  saving = false;
  errorMessage = '';
  eventId: number = 0;

  constructor() {
    this.editForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(2000)]],
      eventDate: ['', [Validators.required]],
      eventTime: ['', [Validators.required]],
      locationName: [''],
      maxParticipants: [null, [Validators.min(1)]],
      cost: [null, [Validators.min(0)]],
      currency: ['EUR'],
      typeId: [null],
      status: ['Draft', [Validators.required]]
    });
  }

  ngOnInit() {
    this.eventId = Number(this.route.snapshot.paramMap.get('id'));
    if (!this.eventId) {
      this.router.navigate(['/events']);
      return;
    }

    this.loadEventTypes();
    this.loadEvent();
    
    // Listen to required fields changes to update publish validation
    this.editForm.get('title')?.valueChanges.subscribe(() => {
      if (this.isPublished) {
        this.onStatusChange();
      }
    });
    
    this.editForm.get('description')?.valueChanges.subscribe(() => {
      if (this.isPublished) {
        this.onStatusChange();
      }
    });
    
    this.editForm.get('eventDate')?.valueChanges.subscribe(() => {
      if (this.isPublished) {
        this.onStatusChange();
      }
    });
    
    this.editForm.get('eventTime')?.valueChanges.subscribe(() => {
      if (this.isPublished) {
        this.onStatusChange();
      }
    });
  }

  async loadEventTypes() {
    try {
      const response = await this.client.active(1, 100, '', 'typeName', false).toPromise();
      this.eventTypes = response?.data?.items || [];
    } catch (error) {
      console.error('Error loading event types:', error);
    }
  }

  async loadEvent() {
    this.loading = true;
    try {
      const response = await this.client.eventsGET(this.eventId, this.authService.currentUserId || undefined).toPromise();
      
      if (response?.success && response.data) {
        this.event = response.data;
        
        // Check if user is the creator
        if (this.event.creator.userId !== this.authService.currentUserId) {
          this.errorMessage = 'Non hai i permessi per modificare questo evento';
          return;
        }

        // Populate form with event data
        const eventDate = new Date(this.event.eventDate);
        const eventTime = eventDate.toTimeString().slice(0, 5); // HH:mm format
        
        this.editForm.patchValue({
          title: this.event.title,
          description: this.event.description,
          eventDate: eventDate.toISOString().split('T')[0],
          eventTime: eventTime,
          locationName: this.event.locationName || '',
          maxParticipants: this.event.maxParticipants,
          cost: this.event.cost,
          currency: this.event.currency || 'EUR',
          typeId: this.event.typeId,
          status: this.event.status
        });
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

  async onSubmit() {
    if (this.editForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.saving = true;
    this.errorMessage = '';

    try {
      const formValue = this.editForm.value;
      
      // Combine date and time
      const eventDateTime = new Date(`${formValue.eventDate}T${formValue.eventTime}`);
      
      const updateDto = new UpdateEventDto({
        title: formValue.title,
        description: formValue.description,
        eventDate: eventDateTime,
        locationName: formValue.locationName || '',
        maxParticipants: formValue.maxParticipants,
        cost: formValue.cost,
        status: formValue.status,
      });

      const response = await this.client.eventsPUT(this.eventId, updateDto).toPromise();

      if (response?.success) {
        // Redirect to event detail page
        this.router.navigate(['/events', this.eventId]);
      } else {
        this.errorMessage = response?.message || 'Errore durante il salvataggio';
      }
    } catch (error: any) {
      console.error('Error updating event:', error);
      this.errorMessage = error?.message || 'Errore durante il salvataggio';
    } finally {
      this.saving = false;
    }
  }

  onStatusChange() {
    const newStatus = this.editForm.get('status')?.value;
    if (newStatus === 'Published') {
      // Validate required fields for publishing
      const requiredFields = ['title', 'description', 'eventDate', 'eventTime'];
      const missingFields = requiredFields.filter(field => 
        !this.editForm.get(field)?.value
      );
      
      if (missingFields.length > 0) {
        this.errorMessage = 'Per pubblicare un evento, tutti i campi obbligatori devono essere compilati';
        this.editForm.get('status')?.setValue('Draft');
        return;
      }
      
      // Check if event date is in the future (compare only date part for today's events)
      const eventDate = new Date(`${this.editForm.get('eventDate')?.value}T${this.editForm.get('eventTime')?.value}`);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const eventDateOnly = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
      
      // If event is today, check if time is in the future
      if (eventDateOnly.getTime() === today.getTime()) {
        if (eventDate <= now) {
          this.errorMessage = 'La data dell\'evento deve essere nel futuro per poterlo pubblicare';
          this.editForm.get('status')?.setValue('Draft');
          return;
        }
      } else if (eventDateOnly < today) {
        // If event date is in the past
        this.errorMessage = 'La data dell\'evento deve essere nel futuro per poterlo pubblicare';
        this.editForm.get('status')?.setValue('Draft');
        return;
      }
    }
    
    this.errorMessage = '';
  }

  private markFormGroupTouched() {
    Object.keys(this.editForm.controls).forEach(key => {
      const control = this.editForm.get(key);
      control?.markAsTouched();
    });
  }

  // Helper methods for template
  isFieldInvalid(fieldName: string): boolean {
    const field = this.editForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.editForm.get(fieldName);
    if (field && field.errors && field.touched) {
      if (field.errors['required']) {
        return 'Campo obbligatorio';
      }
      if (field.errors['minlength']) {
        return `Minimo ${field.errors['minlength'].requiredLength} caratteri`;
      }
      if (field.errors['maxlength']) {
        return `Massimo ${field.errors['maxlength'].requiredLength} caratteri`;
      }
      if (field.errors['min']) {
        return `Valore minimo: ${field.errors['min'].min}`;
      }
    }
    return '';
  }

  get isPublished(): boolean {
    return this.editForm.get('status')?.value === 'Published';
  }

  get canPublish(): boolean {
    const form = this.editForm;
    const hasRequiredFields = form.get('title')?.value && 
                             form.get('description')?.value && 
                             form.get('eventDate')?.value && 
                             form.get('eventTime')?.value;
    
    if (!hasRequiredFields) return false;
    
    // Check if event date is in the future
    const eventDate = new Date(`${form.get('eventDate')?.value}T${form.get('eventTime')?.value}`);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const eventDateOnly = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
    
    // If event is today, check if time is in the future
    if (eventDateOnly.getTime() === today.getTime()) {
      return eventDate > now;
    }
    
    // If event date is in the future
    return eventDateOnly > today;
  }

  get publishErrorMessage(): string {
    const form = this.editForm;
    const hasRequiredFields = form.get('title')?.value && 
                             form.get('description')?.value && 
                             form.get('eventDate')?.value && 
                             form.get('eventTime')?.value;
    
    if (!hasRequiredFields) {
      return 'Tutti i campi obbligatori devono essere compilati';
    }
    
    // Check if event date is in the future
    const eventDate = new Date(`${form.get('eventDate')?.value}T${form.get('eventTime')?.value}`);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const eventDateOnly = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
    
    // If event is today, check if time is in the future
    if (eventDateOnly.getTime() === today.getTime()) {
      if (eventDate <= now) {
        return 'La data dell\'evento deve essere nel futuro';
      }
    } else if (eventDateOnly < today) {
      return 'La data dell\'evento deve essere nel futuro';
    }
    
    return '';
  }
} 