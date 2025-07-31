import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Client } from '../../../api/client';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-my-events',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './my-events.component.html',
  styleUrls: ['./my-events.component.css']
})
export class MyEventsComponent implements OnInit {
  private client = inject(Client);
  private authService = inject(AuthService);
  
  events: any[] = [];
  loading = false;
  
  // Filters (simplified for user's events)
  searchTerm = '';
  sortBy = 'eventDate';
  sortDescending = false;
  
  // Pagination
  currentPage = 1;
  pageSize = 12;
  totalCount = 0;
  totalPages = 0;

  ngOnInit() {
    this.loadMyEvents();
  }

  async loadMyEvents() {
    if (!this.authService.currentUserId) {
      console.error('No authenticated user found');
      return;
    }

    this.loading = true;
    try {
      const response = await this.client.byCreator(
        this.authService.currentUserId,
        this.currentPage,
        this.pageSize,
        this.searchTerm || undefined,
        this.sortBy,
        this.sortDescending
      ).toPromise();

      if (response?.success && response.data) {
        this.events = response.data.items || [];
        this.totalCount = response.data.totalCount || 0;
        this.totalPages = Math.ceil(this.totalCount / this.pageSize);
      }
    } catch (error) {
      console.error('Error loading my events:', error);
    } finally {
      this.loading = false;
    }
  }

  onSearchChange() {
    this.currentPage = 1;
    this.loadMyEvents();
  }

  onSortChange() {
    this.currentPage = 1;
    this.loadMyEvents();
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadMyEvents();
    }
  }

  getPages(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  getMaxItem(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalCount);
  }
} 