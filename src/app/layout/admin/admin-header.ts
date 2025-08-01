import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminDashboardService, AdminHeaderStats } from '../../services/admin-dashboard.service';

@Component({
  selector: 'app-admin-header',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './admin-header.html',
  styleUrls: ['./admin-header.css']
})
export class AdminHeaderComponent implements OnInit {
  // Admin user info
  adminUser = {
    name: 'Admin User',
    email: 'admin@example.com',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
  };

  // UI states
  showNotifications = false;
  showUserMenu = false;
  showSearchResults = false;

  // Search
  searchTerm = '';
  searchResults: any[] = [];

  // Dynamic data from backend
  headerStats: AdminHeaderStats = {
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    activeCustomers: 0
  };

  notifications: any[] = [];
  isLoading = false;

  constructor(
    private router: Router,
    private adminDashboardService: AdminDashboardService
  ) {}

  ngOnInit(): void {
    this.loadHeaderStats();
    this.loadNotifications();
  }

  loadHeaderStats(): void {
    this.isLoading = true;
    this.adminDashboardService.getHeaderStats().subscribe({
      next: (stats) => {
        this.headerStats = stats;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading header stats:', error);
        this.isLoading = false;
        // Fallback to mock data if API fails
        this.headerStats = {
          totalOrders: 1247,
          pendingOrders: 23,
          totalRevenue: 45678.90,
          activeCustomers: 892
        };
      }
    });
  }

  loadNotifications(): void {
    this.adminDashboardService.getNotifications().subscribe({
      next: (notifications) => {
        this.notifications = notifications;
      },
      error: (error) => {
        console.error('Error loading notifications:', error);
        // Fallback to mock data if API fails
        this.notifications = [
          {
            id: 1,
            title: 'New Order #12345',
            message: 'Order placed by Ahmed Ali',
            time: '2 minutes ago',
            unread: true
          },
          {
            id: 2,
            title: 'Payment Received',
            message: 'Payment of $1,250 received',
            time: '15 minutes ago',
            unread: true
          },
          {
            id: 3,
            title: 'Low Stock Alert',
            message: 'Steel pipes running low',
            time: '1 hour ago',
            unread: false
          }
        ];
      }
    });
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
    this.showUserMenu = false;
    this.showSearchResults = false;
  }

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
    this.showNotifications = false;
    this.showSearchResults = false;
  }

  markAsRead(notificationId: number): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.unread = false;
    }
  }

  markAllAsRead(): void {
    this.notifications.forEach(notification => {
      notification.unread = false;
    });
  }

  onSearch(): void {
    if (this.searchTerm.trim()) {
      this.adminDashboardService.searchGlobal(this.searchTerm).subscribe({
        next: (results) => {
          this.searchResults = results;
          this.showSearchResults = true;
        },
        error: (error) => {
          console.error('Error searching:', error);
          this.searchResults = [];
          this.showSearchResults = false;
        }
      });
    } else {
      this.searchResults = [];
      this.showSearchResults = false;
    }
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.searchResults = [];
    this.showSearchResults = false;
  }

  logout(): void {
    console.log('Logging out...');
    this.router.navigate(['/']); // Navigate to home or login page
  }

  goToOrders(): void {
    this.router.navigate(['/admin/orders']);
  }

  goToCustomers(): void {
    this.router.navigate(['/admin/customers']);
  }

  goToProducts(): void {
    this.router.navigate(['/admin/products']);
  }

  goToSuppliers(): void {
    this.router.navigate(['/admin/suppliers']);
  }

  // Utility methods
  getUnreadCount(): number {
    return this.notifications.filter(n => n.unread).length;
  }

  getSearchResultIcon(type: string): string {
    switch (type) {
      case 'order':
        return '📦';
      case 'customer':
        return '👤';
      case 'product':
        return '🛍️';
      case 'supplier':
        return '🏭';
      default:
        return '📢';
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }
}