import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TitleCasePipe } from '@angular/common';
import { Router } from '@angular/router';
import { SellerDashboardService, SellerDashboardStats, SellerNotification } from '../../services/seller-dashboard.service';

@Component({
  selector: 'app-seller-header',
  standalone: true,
  imports: [CommonModule, FormsModule, TitleCasePipe],
  templateUrl: './seller-header.html',
  styleUrl: './seller-header.css'
})
export class SellerHeaderComponent implements OnInit {
  dashboardStats: SellerDashboardStats = {
    totalProducts: 0,
    activeProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalCustomers: 0,
    averageRating: 0,
    totalReviews: 0,
    monthlyGrowth: 0
  };
  headerStats = {
    totalProducts: 0,
    pendingOrders: 0,
    totalEarnings: 0,
    monthlyGrowth: 0
  };
  notifications: SellerNotification[] = [];
  notificationCount = 0;
  showNotifications = false;
  showUserMenu = false;
  showSearchResults = false;
  searchTerm = '';
  searchResults: any[] = [];
  userName = 'John Seller';
  userInitials = 'JS';

  constructor(
    private sellerDashboardService: SellerDashboardService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadDashboardData();
  }

  loadDashboardData() {
    // Load dashboard stats
    this.sellerDashboardService.getDashboardStats().subscribe({
      next: (stats) => {
        this.dashboardStats = stats;
        this.headerStats = {
          totalProducts: stats.totalProducts,
          pendingOrders: stats.pendingOrders,
          totalEarnings: stats.totalRevenue,
          monthlyGrowth: stats.monthlyGrowth
        };
      },
      error: (error) => {
        console.error('Error loading dashboard stats:', error);
        // Fallback to mock data
        this.dashboardStats = {
          totalProducts: 156,
          activeProducts: 128,
          totalOrders: 89,
          pendingOrders: 23,
          completedOrders: 66,
          totalRevenue: 15420.50,
          monthlyRevenue: 1250.00,
          totalCustomers: 45,
          averageRating: 4.3,
          totalReviews: 67,
          monthlyGrowth: 12.5
        };
        this.headerStats = {
          totalProducts: 156,
          pendingOrders: 23,
          totalEarnings: 15420.50,
          monthlyGrowth: 12.5
        };
      }
    });

    // Load notifications
    this.sellerDashboardService.getNotifications().subscribe({
      next: (notifications) => {
        this.notifications = notifications;
        this.notificationCount = notifications.filter(n => !n.isRead).length;
      },
      error: (error) => {
        console.error('Error loading notifications:', error);
        // Fallback to mock data
        this.notifications = [
          {
            id: '1',
            title: 'New Order Received',
            message: 'Order #12345 has been placed',
            type: 'order',
            isRead: false,
            timestamp: new Date()
          },
          {
            id: '2',
            title: 'Low Stock Alert',
            message: 'Product "Steel Pipe" is running low on stock',
            type: 'stock',
            isRead: true,
            timestamp: new Date()
          }
        ];
        this.notificationCount = this.notifications.filter(n => !n.isRead).length;
      }
    });
  }

  toggleNotifications() {
    this.showNotifications = !this.showNotifications;
    this.showUserMenu = false;
  }

  toggleUserMenu() {
    this.showUserMenu = !this.showUserMenu;
    this.showNotifications = false;
  }

  onSearch() {
    if (this.searchTerm.trim()) {
      this.showSearchResults = true;
      // Mock search results
      this.searchResults = [
        { id: '1', name: 'Steel Pipe 2inch', type: 'product' },
        { id: '2', name: 'Order #12345', type: 'order' },
        { id: '3', name: 'Customer John Doe', type: 'customer' }
      ];
    } else {
      this.showSearchResults = false;
      this.searchResults = [];
    }
  }

  clearSearch() {
    this.searchTerm = '';
    this.showSearchResults = false;
    this.searchResults = [];
  }

  markNotificationAsRead(notificationId: string) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification && !notification.isRead) {
      notification.isRead = true;
      this.notificationCount = this.notifications.filter(n => !n.isRead).length;
    }
  }

  markAllAsRead() {
    this.sellerDashboardService.markAllNotificationsAsRead().subscribe({
      next: () => {
        this.notifications.forEach(n => n.isRead = true);
        this.notificationCount = 0;
      },
      error: (error) => {
        console.error('Error marking notifications as read:', error);
        // Fallback to local update
        this.notifications.forEach(n => n.isRead = true);
        this.notificationCount = 0;
      }
    });
  }

  getSearchResultIcon(type: string): string {
    switch (type) {
      case 'product': return '📦';
      case 'order': return '📋';
      case 'customer': return '👤';
      default: return '📄';
    }
  }

  goToProducts() {
    this.router.navigate(['/seller/products']);
  }

  goToOrders() {
    this.router.navigate(['/seller/orders']);
  }

  goToReports() {
    this.router.navigate(['/seller/reports']);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  formatTime(timestamp: Date): string {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) {
      return `${minutes} minutes ago`;
    } else if (hours < 24) {
      return `${hours} hours ago`;
    } else {
      return `${days} days ago`;
    }
  }
} 