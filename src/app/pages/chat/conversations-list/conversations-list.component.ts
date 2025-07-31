import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Client } from '../../../api/client';

@Component({
  selector: 'app-conversations-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './conversations-list.component.html',
  styleUrls: ['./conversations-list.component.css']
})
export class ConversationsListComponent implements OnInit {
  private client = inject(Client);
  
  currentUserId = 1; // TODO: Get from auth service
  conversations: any[] = [];
  loading = false;
  searchTerm = '';
  
  // Pagination
  currentPage = 1;
  pageSize = 20;
  totalCount = 0;

  ngOnInit() {
    this.loadConversations();
  }

  async loadConversations() {
    this.loading = true;
    try {
      const response = await this.client.user(
        this.currentUserId,
        this.currentPage,
        this.pageSize,
        this.searchTerm || undefined,
        'lastActivity',
        true
      ).toPromise();
      
      this.conversations = response?.data?.items || [];
      this.totalCount = response?.data?.totalCount || 0;
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      this.loading = false;
    }
  }

  onSearch() {
    this.currentPage = 1;
    this.loadConversations();
  }

  async markAsRead(conversationId: number) {
    try {
      await this.client.read(conversationId, this.currentUserId).toPromise();
      // Update the conversation in the list
      const conversation = this.conversations.find(c => c.conversationId === conversationId);
      if (conversation) {
        conversation.unreadMessagesCount = 0;
      }
    } catch (error) {
      console.error('Error marking conversation as read:', error);
    }
  }

  getConversationTitle(conversation: any): string {
    if (conversation.conversationType === 'Private') {
      // For private conversations, show the other user's name
      return conversation.displayName || 'Chat Privata';
    }
    return conversation.title || 'Conversazione di Gruppo';
  }

  getLastMessagePreview(conversation: any): string {
    if (!conversation.lastMessageContent) return 'Nessun messaggio';
    
    const maxLength = 60;
    const content = conversation.lastMessageContent;
    return content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
  }

  getTimeAgo(date: Date): string {
    if (!date) return '';
    
    const now = new Date();
    const messageDate = new Date(date);
    const diffInHours = Math.floor((now.getTime() - messageDate.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - messageDate.getTime()) / (1000 * 60));
      return diffInMinutes < 1 ? 'Ora' : `${diffInMinutes}m fa`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h fa`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays === 1) return 'Ieri';
      if (diffInDays < 7) return `${diffInDays}g fa`;
      return messageDate.toLocaleDateString();
    }
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.loadConversations();
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