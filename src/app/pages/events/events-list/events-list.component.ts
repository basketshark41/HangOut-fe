import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Client, CreateParticipationDto } from '../../../api/client';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-events-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './events-list.component.html',
  styleUrls: ['./events-list.component.css']
})
export class EventsListComponent implements OnInit {
  private client = inject(Client);
  private authService = inject(AuthService);
  
  events: any[] = [];
  eventTypes: any[] = [];
  loading = false;
  
  // Filters
  searchTerm = '';
  selectedEventTypes: number[] = [];
  startDate: string = '';
  endDate: string = '';
  maxCost: number | null = null;
  location = '';
  radius: number | null = null;
  friendsOnly = false;
  sortBy = 'eventDate';
  sortDescending = false;
  
  // Pagination
  currentPage = 1;
  pageSize = 12;
  totalCount = 0;
  totalPages = 0;

  ngOnInit() {
    this.loadEventTypes();
    this.loadEvents();
  }

  async loadEventTypes() {
    try {
      const response = await this.client.active(1, 100, '', 'typeName', false).toPromise();
      this.eventTypes = response?.data?.items || [];
    } catch (error) {
      console.error('Error loading event types:', error);
    }
  }

  async loadEvents() {
    this.loading = true;
    try {
      const startDateObj = this.startDate ? new Date(this.startDate) : undefined;
      const endDateObj = this.endDate ? new Date(this.endDate) : undefined;

      const response = await this.client.eventsGET2(
        this.currentPage,
        this.pageSize,
        this.searchTerm || undefined,
        this.sortBy,
        this.sortDescending,
        startDateObj,
        endDateObj,
        this.selectedEventTypes.length > 0 ? this.selectedEventTypes : undefined,
        this.maxCost || undefined,
        this.location || undefined,
        this.radius || undefined,
        undefined, // userLatitude
        undefined, // userLongitude
        this.friendsOnly,
        'Published'
      ).toPromise();

      this.events = response?.data?.items || [];
      this.totalCount = response?.data?.totalCount || 0;
      this.totalPages = response?.data?.totalPages || 0;

      // Add participation information for each event
      if (this.authService.currentUserId) {
        await this.loadParticipationInfo();
      }
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      this.loading = false;
    }
  }

  private async loadParticipationInfo() {
    for (const event of this.events) {
      await this.updateEventParticipationInfo(event);
    }
  }

  private async updateEventParticipationInfo(event: any) {
    try {
      // Check if user can join
      const canJoinResponse = await this.client.canJoin2(event.eventId).toPromise();
      event.canUserJoin = canJoinResponse?.success && canJoinResponse.data;

      // Check if user is participating
      const isParticipatingResponse = await this.client.isParticipating2(event.eventId).toPromise();
      event.isUserParticipating = isParticipatingResponse?.success && isParticipatingResponse.data;

      // Add creator ID (assuming it's available in the event data)
      // If not available, you might need to get it from a different endpoint
      event.creatorId = event.creatorId || 0; // This should be populated by the backend
    } catch (error) {
      console.error(`Error updating participation info for event ${event.eventId}:`, error);
      event.canUserJoin = false;
      event.isUserParticipating = false;
    }
  }

  onSearch() {
    this.currentPage = 1;
    this.loadEvents();
  }

  onFilterChange() {
    this.currentPage = 1;
    this.loadEvents();
  }

  onEventTypeToggle(typeId: number) {
    const index = this.selectedEventTypes.indexOf(typeId);
    if (index > -1) {
      this.selectedEventTypes.splice(index, 1);
    } else {
      this.selectedEventTypes.push(typeId);
    }
    this.onFilterChange();
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.loadEvents();
  }

  onSortChange(sortBy: string) {
    if (this.sortBy === sortBy) {
      this.sortDescending = !this.sortDescending;
    } else {
      this.sortBy = sortBy;
      this.sortDescending = false;
    }
    this.loadEvents();
  }

  clearFilters() {
    this.searchTerm = '';
    this.selectedEventTypes = [];
    this.startDate = '';
    this.endDate = '';
    this.maxCost = null;
    this.location = '';
    this.radius = null;
    this.friendsOnly = false;
    this.onFilterChange();
  }

  getPages(): number[] {
    const pages = [];
    const start = Math.max(1, this.currentPage - 2);
    const end = Math.min(this.totalPages, this.currentPage + 2);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  getMaxItem(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalCount);
  }

  // Participation methods
  async joinEvent(eventId: number, event: Event) {
    event.stopPropagation();
    
    const targetEvent = this.events.find(e => e.eventId === eventId);
    if (!targetEvent) return;
    
    targetEvent.joining = true;
    
    try {
      // Use the newer endpoint that takes CreateParticipationDto
      const participationDto = new CreateParticipationDto({
        eventId: eventId
      });
      const response = await this.client.join2(participationDto).toPromise();
      
      if (response?.success) {
        // Update the event data
        targetEvent.isUserParticipating = true;
        targetEvent.currentParticipants = (targetEvent.currentParticipants || 0) + 1;
        targetEvent.canUserJoin = false;
        
        console.log('Successfully joined event:', eventId);
        // Update participation info
        await this.updateEventParticipationInfo(targetEvent);
      } else {
        console.error('Failed to join event:', response?.message);
      }
    } catch (error) {
      console.error('Error joining event:', error);
    } finally {
      targetEvent.joining = false;
    }
  }

  async leaveEvent(eventId: number, event: Event) {
    event.stopPropagation();
    
    const targetEvent = this.events.find(e => e.eventId === eventId);
    if (!targetEvent) return;
    
    targetEvent.leaving = true;
    
    try {
      // Use the newer endpoint that takes eventId
      const response = await this.client.leave3(eventId).toPromise();
      
      if (response?.success) {
        // Update the event data
        targetEvent.isUserParticipating = false;
        targetEvent.currentParticipants = Math.max(0, (targetEvent.currentParticipants || 0) - 1);
        targetEvent.canUserJoin = true;
        
        console.log('Successfully left event:', eventId);
        // Update participation info
        await this.updateEventParticipationInfo(targetEvent);
      } else {
        console.error('Failed to leave event:', response?.message);
      }
    } catch (error) {
      console.error('Error leaving event:', error);
    } finally {
      targetEvent.leaving = false;
    }
  }

  getCannotJoinMessage(event: any): string {
    if (event.currentParticipants >= event.maxParticipants && event.maxParticipants) {
      return 'Evento al completo';
    }
    
    if (event.creatorId && event.creatorId === this.authService.currentUserId) {
      return 'Sei il creatore dell\'evento';
    }
    
    if (event.eventDate && new Date(event.eventDate) <= new Date()) {
      return 'Evento già passato';
    }
    
    return 'Non puoi partecipare';
  }
} 