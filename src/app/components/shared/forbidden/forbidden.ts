import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { Auth } from '../../../services/auth';
import { Role } from '../../../models/enums/roles';

@Component({
  selector: 'app-forbidden',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gray-100 flex flex-col justify-center items-center px-4">
      <div class="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <div class="text-red-500 text-6xl mb-4">
          <i class="fas fa-exclamation-circle"></i>
        </div>
        <h1 class="text-2xl font-bold text-gray-800 mb-4">Access Denied</h1>
        <div class="text-gray-600 mb-6">
          <p class="mb-2">Your current role: <span class="font-semibold">{{currentRole}}</span></p>
          <p>Required roles: <span class="font-semibold">{{requiredRoles}}</span></p>
          <p class="mt-4">You don't have permission to access this page.</p>
        </div>
        <div class="flex flex-col gap-3">
          <a [routerLink]="getDashboardLink()"
             class="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 transition-colors">
            Go to Dashboard
          </a>
          <a routerLink="/login" *ngIf="currentRole === Role.Guest"
             class="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600 transition-colors">
            Login
          </a>
        </div>
      </div>
    </div>
  `
})
export class ForbiddenComponent implements OnInit {
  currentRole: string = Role.Guest;
  requiredRoles: string = '';
  Role = Role; // Make enum available in template

  constructor(
    private auth: Auth,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.currentRole = params['currentRole'] || Role.Guest;
      this.requiredRoles = params['requiredRoles']?.replace(',', ' or ') || 'Unknown';
    });
  }

  getDashboardLink(): string {
    const user = this.auth.getCurrentUser();
    if (user?.roles?.includes(Role.Admin)) return '/admin/dashboard';
    if (user?.roles?.includes(Role.Seller)) return '/seller/dashboard';
    return '/';
  }
}
