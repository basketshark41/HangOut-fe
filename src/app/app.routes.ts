import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './guards/auth.guard';

export const routes: Routes = [
  // Home
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent)
  },

  // Authentication
  {
    path: 'login',
    loadComponent: () => import('./pages/auth/login/login.component').then(m => m.LoginComponent),
    canActivate: [guestGuard]
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/auth/register/register.component').then(m => m.RegisterComponent),
    canActivate: [guestGuard]
  },
  
  // Events
  {
    path: 'events',
    loadComponent: () => import('./pages/events/events-list/events-list.component').then(m => m.EventsListComponent)
  },
  {
    path: 'events/create',
    loadComponent: () => import('./pages/events/create-event/create-event.component').then(m => m.CreateEventComponent),
    canActivate: [authGuard]
  },
  {
    path: 'events/my-events',
    loadComponent: () => import('./pages/events/my-events/my-events.component').then(m => m.MyEventsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'events/:id',
    loadComponent: () => import('./pages/events/event-detail/event-detail.component').then(m => m.EventDetailComponent)
  },
  {
    path: 'events/:id/edit',
    loadComponent: () => import('./pages/events/edit-event/edit-event.component').then(m => m.EditEventComponent),
    canActivate: [authGuard]
  },
  // {
  //   path: 'events/:id/participants',
  //   loadComponent: () => import('./pages/events/event-participants/event-participants.component').then(m => m.EventParticipantsComponent)
  // },
  
  // Friends
  {
    path: 'friends',
    loadComponent: () => import('./pages/friends/friends-list/friends-list.component').then(m => m.FriendsListComponent),
    canActivate: [authGuard]
  },
  // TODO: Implement these components
  // {
  //   path: 'friends/search',
  //   loadComponent: () => import('./pages/friends/search-friends/search-friends.component').then(m => m.SearchFriendsComponent)
  // },

  // Chat
  {
    path: 'chat',
    loadComponent: () => import('./pages/chat/conversations-list/conversations-list.component').then(m => m.ConversationsListComponent),
    canActivate: [authGuard]
  },
  // TODO: Implement these components
  // {
  //   path: 'chat/:id',
  //   loadComponent: () => import('./pages/chat/conversation-detail/conversation-detail.component').then(m => m.ConversationDetailComponent)
  // },

  // TODO: Implement these components
  // // Notifications
  // {
  //   path: 'notifications',
  //   loadComponent: () => import('./pages/notifications/notifications-list/notifications-list.component').then(m => m.NotificationsListComponent)
  // },

  // // Profile & Users
  // {
  //   path: 'profile',
  //   loadComponent: () => import('./pages/profile/user-profile/user-profile.component').then(m => m.UserProfileComponent)
  // },
  // {
  //   path: 'users/:id',
  //   loadComponent: () => import('./pages/profile/user-profile/user-profile.component').then(m => m.UserProfileComponent)
  // },
  // {
  //   path: 'settings',
  //   loadComponent: () => import('./pages/profile/user-settings/user-settings.component').then(m => m.UserSettingsComponent)
  // },

  // Redirect unknown routes to home
  {
    path: '**',
    redirectTo: ''
  }
];
