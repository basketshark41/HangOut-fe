import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Client } from '../../../api/client';

@Component({
  selector: 'app-friends-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './friends-list.component.html',
  styleUrls: ['./friends-list.component.css']
})
export class FriendsListComponent implements OnInit {
  private client = inject(Client);
  
  currentUserId = 1; // TODO: Get from auth service
  activeTab = 'friends'; // friends, pending, sent
  loading = false;
  
  friends: any[] = [];
  pendingRequests: any[] = [];
  sentRequests: any[] = [];
  
  // Pagination
  currentPage = 1;
  pageSize = 20;
  totalCount = 0;
  
  // Search
  searchTerm = '';

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    this.loading = true;
    try {
      switch (this.activeTab) {
        case 'friends':
          await this.loadFriends();
          break;
        case 'pending':
          await this.loadPendingRequests();
          break;
        case 'sent':
          await this.loadSentRequests();
          break;
      }
    } finally {
      this.loading = false;
    }
  }

  async loadFriends() {
    try {
      const response = await this.client.friends2(
        this.currentUserId,
        this.currentPage,
        this.pageSize,
        this.searchTerm || undefined,
        'friendsSince',
        true
      ).toPromise();
      
      this.friends = response?.data?.items || [];
      this.totalCount = response?.data?.totalCount || 0;
    } catch (error) {
      console.error('Error loading friends:', error);
    }
  }

  async loadPendingRequests() {
    try {
      const response = await this.client.pending(
        this.currentUserId,
        this.currentPage,
        this.pageSize,
        this.searchTerm || undefined,
        'requestDate',
        true
      ).toPromise();
      
      this.pendingRequests = response?.data?.items || [];
      this.totalCount = response?.data?.totalCount || 0;
    } catch (error) {
      console.error('Error loading pending requests:', error);
    }
  }

  async loadSentRequests() {
    try {
      const response = await this.client.sent(
        this.currentUserId,
        this.currentPage,
        this.pageSize,
        this.searchTerm || undefined,
        'requestDate',
        true
      ).toPromise();
      
      this.sentRequests = response?.data?.items || [];
      this.totalCount = response?.data?.totalCount || 0;
    } catch (error) {
      console.error('Error loading sent requests:', error);
    }
  }

  onTabChange(tab: string) {
    this.activeTab = tab;
    this.currentPage = 1;
    this.searchTerm = '';
    this.loadData();
  }

  onSearch() {
    this.currentPage = 1;
    this.loadData();
  }

  async acceptFriendRequest(friendshipId: number) {
    try {
      const response = await this.client.accept(friendshipId, this.currentUserId).toPromise();
      if (response?.success) {
        await this.loadData(); // Refresh the list
      }
    } catch (error) {
      console.error('Error accepting friend request:', error);
    }
  }

  async declineFriendRequest(friendshipId: number) {
    try {
      const response = await this.client.decline(friendshipId, this.currentUserId).toPromise();
      if (response?.success) {
        await this.loadData(); // Refresh the list
      }
    } catch (error) {
      console.error('Error declining friend request:', error);
    }
  }

  async blockUser(friendshipId: number) {
    try {
      const response = await this.client.block(friendshipId, this.currentUserId).toPromise();
      if (response?.success) {
        await this.loadData(); // Refresh the list
      }
    } catch (error) {
      console.error('Error blocking user:', error);
    }
  }

  async removeFriend(friendshipId: number) {
    if (confirm('Sei sicuro di voler rimuovere questo amico?')) {
      try {
        const response = await this.client.friendships(friendshipId, this.currentUserId).toPromise();
        if (response?.success) {
          await this.loadData(); // Refresh the list
        }
      } catch (error) {
        console.error('Error removing friend:', error);
      }
    }
  }

  async startConversation(userId: number) {
    try {
      // Create private conversation
      const response = await this.client.private(this.currentUserId, userId).toPromise();
      if (response?.success && response.data?.conversationId) {
        // Navigate to conversation
        // TODO: Implement navigation to chat
        console.log('Navigate to conversation:', response.data.conversationId);
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.loadData();
  }

  getPages(): number[] {
    const totalPages = Math.ceil(this.totalCount / this.pageSize);
    const pages = [];
    const start = Math.max(1, this.currentPage - 2);
    const end = Math.min(totalPages, this.currentPage + 2);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }
} 