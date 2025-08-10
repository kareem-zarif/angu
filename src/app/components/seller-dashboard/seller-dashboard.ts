import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Chart, ChartConfiguration, ChartType } from 'chart.js';
import { SellerDashboardService, SellerDashboardStats, SellerNotification, ChartData, ProductStats, OrderStats, RevenueStats } from '../../services/seller-dashboard.service';

@Component({
  selector: 'app-seller-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './seller-dashboard.html',
  styleUrl: './seller-dashboard.css'
})
export class SellerDashboardComponent implements OnInit, OnDestroy, AfterViewInit {
  
  @ViewChild('productChartCanvas', { static: false }) productChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('orderChartCanvas', { static: false }) orderChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('revenueChartCanvas', { static: false }) revenueChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('ordersChartCanvas', { static: false }) ordersChartCanvas!: ElementRef<HTMLCanvasElement>;

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

  recentOrders: any[] = [];
  notifications: SellerNotification[] = [];

  // Chart instances
  private productChart?: Chart;
  private orderChart?: Chart;
  private revenueChart?: Chart;
  private ordersChart?: Chart;

  // Loading states
  isLoading = false;
  isChartsLoading = false;

  // Stats data
  productStats: ProductStats | null = null;
  orderStats: OrderStats | null = null;
  revenueStats: RevenueStats | null = null;

  constructor(private sellerDashboardService: SellerDashboardService) {}

  ngOnInit() {
    this.loadDashboardData();
  }

  ngAfterViewInit(): void {
    // Initialize charts after view is ready
    setTimeout(() => {
      this.initializeCharts();
    }, 100);
  }

  ngOnDestroy(): void {
    // Destroy charts to prevent memory leaks
    if (this.productChart) this.productChart.destroy();
    if (this.orderChart) this.orderChart.destroy();
    if (this.revenueChart) this.revenueChart.destroy();
    if (this.ordersChart) this.ordersChart.destroy();
  }

  loadDashboardData() {
    this.isLoading = true;
    
    // Load dashboard stats
    this.sellerDashboardService.getDashboardStats().subscribe({
      next: (stats) => {
        this.dashboardStats = stats;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading dashboard stats:', error);
        this.isLoading = false;
      }
    });

    // Load recent orders
    this.sellerDashboardService.getRecentOrders().subscribe({
      next: (orders) => {
        this.recentOrders = orders;
      },
      error: (error) => {
        console.error('Error loading recent orders:', error);
      }
    });

    // Load notifications
    this.sellerDashboardService.getNotifications().subscribe({
      next: (notifications) => {
        this.notifications = notifications;
      },
      error: (error) => {
        console.error('Error loading notifications:', error);
        this.notifications = [];
      }
    });

    // Load detailed stats for charts
    this.loadDetailedStats();
  }

  loadDetailedStats(): void {
    this.isChartsLoading = true;

    // Load product stats
    this.sellerDashboardService.getProductStats().subscribe({
      next: (stats) => {
        this.productStats = stats;
        this.updateProductChart();
      },
      error: (error) => {
        console.error('Error loading product stats:', error);
      }
    });

    // Load order stats
    this.sellerDashboardService.getOrderStats().subscribe({
      next: (stats) => {
        this.orderStats = stats;
        this.updateOrderChart();
        this.updateOrdersChart();
      },
      error: (error) => {
        console.error('Error loading order stats:', error);
      }
    });

    // Load revenue stats
    this.sellerDashboardService.getRevenueStats().subscribe({
      next: (stats) => {
        this.revenueStats = stats;
        this.updateRevenueChart();
        this.isChartsLoading = false;
      },
      error: (error) => {
        console.error('Error loading revenue stats:', error);
        this.isChartsLoading = false;
      }
    });
  }

  initializeCharts(): void {
    // Initialize product chart
    if (this.productChartCanvas) {
      this.createProductChart();
    }

    // Initialize order chart
    if (this.orderChartCanvas) {
      this.createOrderChart();
    }

    // Initialize revenue chart
    if (this.revenueChartCanvas) {
      this.createRevenueChart();
    }

    // Initialize orders chart
    if (this.ordersChartCanvas) {
      this.createOrdersChart();
    }
  }

  createProductChart(): void {
    const ctx = this.productChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    this.productChart = new Chart(ctx, {
      type: 'doughnut' as ChartType,
      data: {
        labels: ['Active', 'Pending', 'Rejected', 'Low Stock'],
        datasets: [{
          data: [0, 0, 0, 0],
          backgroundColor: ['#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          },
          title: {
            display: true,
            text: 'Products by Status'
          }
        }
      }
    });
  }

  createOrderChart(): void {
    const ctx = this.orderChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    this.orderChart = new Chart(ctx, {
      type: 'doughnut' as ChartType,
      data: {
        labels: ['Completed', 'Pending', 'Cancelled'],
        datasets: [{
          data: [0, 0, 0],
          backgroundColor: ['#10B981', '#F59E0B', '#EF4444'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          },
          title: {
            display: true,
            text: 'Orders by Status'
          }
        }
      }
    });
  }

  createRevenueChart(): void {
    const ctx = this.revenueChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    this.revenueChart = new Chart(ctx, {
      type: 'line' as ChartType,
      data: {
        labels: [],
        datasets: [{
          label: 'Monthly Revenue (EGP)',
          data: [],
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top'
          },
          title: {
            display: true,
            text: 'Revenue Trend'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return 'EGP ' + value.toLocaleString();
              }
            }
          }
        }
      }
    });
  }

  createOrdersChart(): void {
    const ctx = this.ordersChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    this.ordersChart = new Chart(ctx, {
      type: 'bar' as ChartType,
      data: {
        labels: [],
        datasets: [{
          label: 'Monthly Orders',
          data: [],
          backgroundColor: '#8B5CF6',
          borderColor: '#7C3AED',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top'
          },
          title: {
            display: true,
            text: 'Orders Trend'
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }

  updateProductChart(): void {
    if (this.productChart && this.productStats) {
      this.productChart.data.datasets[0].data = [
        this.productStats.activeProducts,
        this.productStats.pendingProducts,
        this.productStats.rejectedProducts,
        this.productStats.lowStockProducts
      ];
      this.productChart.update();
    }
  }

  updateOrderChart(): void {
    if (this.orderChart && this.orderStats) {
      this.orderChart.data.datasets[0].data = [
        this.orderStats.completedOrders,
        this.orderStats.pendingOrders,
        this.orderStats.cancelledOrders
      ];
      this.orderChart.update();
    }
  }

  updateRevenueChart(): void {
    if (this.revenueChart && this.revenueStats) {
      this.revenueChart.data.labels = this.revenueStats.revenueByMonth.map(item => item.month);
      this.revenueChart.data.datasets[0].data = this.revenueStats.revenueByMonth.map(item => item.revenue);
      this.revenueChart.update();
    }
  }

  updateOrdersChart(): void {
    if (this.ordersChart && this.orderStats) {
      this.ordersChart.data.labels = this.orderStats.monthlyOrders.map(item => item.month);
      this.ordersChart.data.datasets[0].data = this.orderStats.monthlyOrders.map(item => item.count);
      this.ordersChart.update();
    }
  }

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
      case 'processing':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'shipped':
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'delivered':
      case 'completed':
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

  refreshData(): void {
    this.loadDashboardData();
  }
} 