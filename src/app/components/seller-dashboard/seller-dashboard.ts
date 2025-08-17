import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { SellerDashboardService, SellerDashboardStats } from '../../services/seller-dashboard.service';

@Component({
  selector: 'app-seller-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './seller-dashboard.html',
  styleUrl: './seller-dashboard.css'
})
export class SellerDashboardComponent implements OnInit, OnDestroy {
  private subscription = new Subscription();

  // Dashboard data
  dashboardStats: SellerDashboardStats = {
    totalProducts: 0,
    activeProducts: 0,
    pendingProducts: 0,
    rejectedProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    weeklyRevenue: 0,
    totalCustomers: 0,
    averageRating: 0,
    totalReviews: 0,
    monthlyGrowth: 0,
    lowStockProducts: 0
  };

  // Loading states
  isLoading = false;
  hasError = false;
  errorMessage = '';

  constructor(private sellerDashboardService: SellerDashboardService) {}

  ngOnInit(): void {
    console.log('🔄 SellerDashboard: Component initialized');
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  loadDashboardData(): void {
    console.log('🔄 SellerDashboard: Starting to load dashboard data...');
    this.isLoading = true;
    this.hasError = false;
    this.errorMessage = '';

    this.subscription.add(
      this.sellerDashboardService.getDashboardStats().subscribe({
        next: (stats) => {
          console.log('✅ SellerDashboard: Dashboard stats loaded successfully:', stats);
          this.dashboardStats = stats;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('❌ SellerDashboard: Error loading dashboard stats:', error);
          this.hasError = true;
          this.errorMessage = 'Failed to load dashboard data. Please try again.';
          this.isLoading = false;
        }
      })
    );
  }

  refreshData(): void {
    console.log('🔄 SellerDashboard: Refreshing data...');
    this.loadDashboardData();
  }

  // Helper methods for formatting
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EGP'
    }).format(amount);
  }

  formatNumber(num: number): string {
    return num.toLocaleString();
  }

  getPercentage(value: number, total: number): string {
    if (total === 0) return '0%';
    return ((value / total) * 100).toFixed(1) + '%';
  }

  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'active':
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
}




