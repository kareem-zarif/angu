import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Auth } from '../../../services/auth';

@Component({
  selector: 'app-logout',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-[40vh] flex items-center justify-center text-gray-600">
      <div>Logging you out...</div>
    </div>
  `
})
export class LogoutComponent implements OnInit {
  constructor(private auth: Auth, private router: Router) {}

  ngOnInit(): void {
    try {
      this.auth.logout();
    } catch {}
    // Small timeout to allow subscribers to react, then hard refresh
    setTimeout(() => { location.href = '/products'; }, 0);
  }
}


