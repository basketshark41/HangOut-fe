import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navigation/navbar/navbar.component';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'HangOut';
  private authService = inject(AuthService);

  ngOnInit() {
    console.log('🚀 App starting...');
    console.log('🔐 Initial auth state:', this.authService.isAuthenticated);
    console.log('👤 Initial user:', this.authService.currentUser);
  }
}
