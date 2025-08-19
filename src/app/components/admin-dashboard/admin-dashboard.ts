import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminDashboardService, DashboardStats, RecentActivity, ChartData, ProductStats, OrderStats, SupplierStats } from '../../services/admin-dashboard.service';
import { Chart, ChartType } from 'chart.js'; // Add this import


@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.css']
})
export class AdminDashboardComponent implements OnInit, OnDestroy, AfterViewInit {

  @ViewChild('productChartCanvas', { static: false }) productChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('orderChartCanvas', { static: false }) orderChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('revenueChartCanvas', { static: false }) revenueChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('ordersChartCanvas', { static: false }) ordersChartCanvas!: ElementRef<HTMLCanvasElement>;

  // Dashboard stats
  dashboardStats: DashboardStats = {
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    activeCustomers: 0,
    totalProducts: 0,
    totalSuppliers: 0,
    totalCategories: 0,
    totalSubCategories: 0,
    approvedProducts: 0,
    pendingProducts: 0,
    rejectedProducts: 0,
    lowStockProducts: 0,
    monthlyRevenue: 0,
    weeklyOrders: 0
  };

  // Recent activities
  recentActivities: RecentActivity[] = [];

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
  supplierStats: SupplierStats | null = null;

  constructor(private adminDashboardService: AdminDashboardService) {}

  ngOnInit(): void {
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

  loadDashboardData(): void {
    console.log('🔄 AdminDashboardComponent: Starting to load dashboard data...');
    this.isLoading = true;

    // Load dashboard stats
    this.adminDashboardService.getDashboardStats().subscribe({
      next: (stats) => {
        console.log('✅ AdminDashboardComponent: Dashboard stats received:', stats);
        this.dashboardStats = stats;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ AdminDashboardComponent: Error loading dashboard stats:', error);
        this.isLoading = false;
      }
    });

    // Load recent activities
    this.adminDashboardService.getRecentActivities().subscribe({
      next: (activities) => {
        console.log('✅ AdminDashboardComponent: Recent activities received:', activities);
        this.recentActivities = activities;
      },
      error: (error) => {
        console.error('❌ AdminDashboardComponent: Error loading recent activities:', error);
      }
    });

    // Load detailed stats for charts
    this.loadDetailedStats();
  }

  loadDetailedStats(): void {
    this.isChartsLoading = true;

    // Load product stats
    this.adminDashboardService.getProductStats().subscribe({
      next: (stats) => {
        this.productStats = stats;
        this.updateProductChart();
      },
      error: (error) => {
        console.error('Error loading product stats:', error);
      }
    });

    // Load order stats
    this.adminDashboardService.getOrderStats().subscribe({
      next: (stats) => {
        this.orderStats = stats;
        this.updateOrderChart();
        this.updateRevenueChart();
        this.updateOrdersChart();
      },
      error: (error) => {
        console.error('Error loading order stats:', error);
      }
    });

    // Load supplier stats
    this.adminDashboardService.getSupplierStats().subscribe({
      next: (stats) => {
        this.supplierStats = stats;
        this.isChartsLoading = false;
      },
      error: (error) => {
        console.error('Error loading supplier stats:', error);
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
        labels: ['Approved', 'Pending', 'Rejected', 'Low Stock'],
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
            text: 'Monthly Revenue Trend'
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
            text: 'Monthly Orders Trend'
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
        this.productStats.approvedProducts,
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
    if (this.revenueChart && this.orderStats) {
      this.revenueChart.data.labels = this.orderStats.revenueByMonth.map(item => item.month);
      this.revenueChart.data.datasets[0].data = this.orderStats.revenueByMonth.map(item => item.revenue);
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
      case 'category':
        return '📂';
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

  refreshData(): void {
    console.log('🔄 AdminDashboardComponent: Refresh button clicked, reloading data...');
    this.loadDashboardData();
  }
}
