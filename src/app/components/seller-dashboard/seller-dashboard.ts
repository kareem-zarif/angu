import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SellerDashboardService, SellerDashboardStats, SellerNotification } from '../../services/seller-dashboard.service';

@Component({
  selector: 'app-seller-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './seller-dashboard.html',
  styleUrl: './seller-dashboard.css'
})
export class SellerDashboardComponent implements OnInit {
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
  recentOrders: any[] = [];
  notifications: SellerNotification[] = [];
  isLoading = false;

  constructor(private sellerDashboardService: SellerDashboardService) {}

  ngOnInit() {
    this.loadDashboardData();
  }

  loadDashboardData() {
    this.isLoading = true;
    
    // Load dashboard stats
    this.sellerDashboardService.getDashboardStats().subscribe({
      next: (stats) => {
        this.dashboardStats = stats;
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
      }
    });

    // Load recent orders
    this.sellerDashboardService.getRecentOrders().subscribe({
      next: (orders) => {
        this.recentOrders = orders;
      },
      error: (error) => {
        console.error('Error loading recent orders:', error);
        // Fallback to mock data
        this.recentOrders = [
          {
            id: '1',
            customerName: 'John Doe',
            amount: 1250.00,
            status: 'Processing',
            date: new Date()
          },
          {
            id: '2',
            customerName: 'Jane Smith',
            amount: 890.50,
            status: 'Shipped',
            date: new Date()
          }
        ];
      }
    });

    // Load notifications
    this.sellerDashboardService.getNotifications().subscribe({
      next: (notifications) => {
        this.notifications = notifications;
        this.isLoading = false;
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
        this.isLoading = false;
      }
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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