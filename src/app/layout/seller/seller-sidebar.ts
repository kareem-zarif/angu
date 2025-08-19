import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-seller-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './seller-sidebar.html',
  styleUrl: './seller-sidebar.css'
})
export class SellerSidebarComponent {
  constructor(private auth: Auth, private router: Router) {}

  logout(): void {
    this.auth.logout();
    // Hard refresh to ensure clean state
    location.href = '/products';
  }
}