import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminDashboardService, DashboardStats, RecentActivity } from '../../services/admin-dashboard.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.css']
})
export class AdminDashboardComponent implements OnInit {
  
  // Dashboard stats
  dashboardStats: DashboardStats = {
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    activeCustomers: 0,
    totalProducts: 0,
    totalSuppliers: 0
  };

  // Recent activities
  recentActivities: RecentActivity[] = [];

  isLoading = false;

  constructor(private adminDashboardService: AdminDashboardService) {}

  ngOnInit(): void {
    this.loadDashboardStats();
    this.loadRecentActivities();
  }

  loadDashboardStats(): void {
    this.isLoading = true;
    this.adminDashboardService.getDashboardStats().subscribe({
      next: (stats) => {
        this.dashboardStats = stats;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading dashboard stats:', error);
        this.isLoading = false;
        // Fallback to mock data if API fails
        this.dashboardStats = {
          totalOrders: 1247,
          pendingOrders: 23,
          totalRevenue: 45678.90,
          activeCustomers: 892,
          totalProducts: 156,
          totalSuppliers: 45
        };
      }
    });
  }

  loadRecentActivities(): void {
    this.adminDashboardService.getRecentActivities().subscribe({
      next: (activities) => {
        this.recentActivities = activities;
      },
      error: (error) => {
        console.error('Error loading recent activities:', error);
        // Fallback to mock data if API fails
        this.recentActivities = [
          {
            id: 1,
            type: 'order',
            title: 'New Order #12345',
            description: 'Order placed by Ahmed Ali',
            time: '2 minutes ago',
            status: 'pending'
          },
          {
            id: 2,
            type: 'customer',
            title: 'New Customer Registration',
            description: 'Mohammed Hassan registered',
            time: '15 minutes ago',
            status: 'completed'
          },
          {
            id: 3,
            type: 'product',
            title: 'Product Updated',
            description: 'Steel Pipes stock updated',
            time: '1 hour ago',
            status: 'completed'
          },
          {
            id: 4,
            type: 'supplier',
            title: 'New Supplier Added',
            description: 'ABC Steel Company added',
            time: '2 hours ago',
            status: 'completed'
          }
        ];
      }
    });
  }

  getActivityIcon(type: string): string {
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

  getStatusColor(status: string): string {
    switch (status) {
      case 'pending':
        return 'text-orange-600 bg-orange-100';
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }
} 