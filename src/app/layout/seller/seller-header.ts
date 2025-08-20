import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TitleCasePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { SellerDashboardService, SellerDashboardStats } from '../../services/seller-dashboard.service';
import { LocalStorageNotificationService, LocalNotification, NotificationType } from '../../services/local-storage-notification.service';
import { Auth } from '../../services/auth';
import { forkJoin, interval, Subscription as RxSubscription } from 'rxjs';
import { ProductService } from '../../services/product-service';
import { ProductApprovalStatus } from '../../models/i-product';
import { SellerOrdersService } from '../../services/seller-orders.service';

@Component({
  selector: 'app-seller-header',
  standalone: true,
  imports: [CommonModule, FormsModule, TitleCasePipe, RouterLink],
  templateUrl: './seller-header.html',
  styleUrl: './seller-header.css'
})
export class SellerHeaderComponent implements OnInit, OnDestroy {
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
  headerStats = {
    totalProducts: 0,
    pendingOrders: 0,
    totalEarnings: 0,
    monthlyGrowth: 0
  };
  isLoading = false;
  notifications: LocalNotification[] = [];
  notificationCount = 0;
  showNotifications = false;
  showUserMenu = false;
  showSearchResults = false;
  searchTerm = '';
  searchResults: any[] = [];
  userName = 'John Seller';
  userInitials = 'JS';
  private subscription = new Subscription();
  private currentSellerId: string = '';
  private refreshSubscription?: RxSubscription;

  constructor(
    private sellerDashboardService: SellerDashboardService,
    private localNotificationService: LocalStorageNotificationService,
    private router: Router,
    private auth: Auth,
    private productService: ProductService,
    private sellerOrdersService: SellerOrdersService
  ) {}

  ngOnInit() {
    this.currentSellerId = this.auth.getCurrentUser()?.UserId || '';
    
    // Get seller name from auth service
    const sellerName = this.auth.getSellerName();
    if (sellerName) {
      this.userName = sellerName;
      this.userInitials = this.getInitials(sellerName);
    }
    
    // Subscribe to auth changes to update seller name
    this.subscription.add(
      this.auth.currentUser$.subscribe(user => {
        if (user) {
          this.currentSellerId = user.UserId;
          if (user.sellerName) {
            this.userName = user.sellerName;
            this.userInitials = this.getInitials(user.sellerName);
          }
        } else {
          this.currentSellerId = '';
          this.userName = 'Guest';
          this.userInitials = 'G';
        }
      })
    );
    
    this.loadDashboardData();
    this.loadHeaderStats();
    // Periodically refresh stats to keep navbar numbers in sync
    this.refreshSubscription = interval(30000).subscribe(() => this.loadHeaderStats());
    
    // Subscribe to real-time notifications from local storage service
    if (this.currentSellerId) {
      this.subscription.add(
        this.localNotificationService.getSellerNotifications(this.currentSellerId).subscribe(notifications => {
          this.notifications = notifications;
          this.notificationCount = notifications.filter(n => !n.isRead).length;
        })
      );
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    this.refreshSubscription?.unsubscribe();
  }

  loadDashboardData() {
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
          pendingProducts: 20,
          rejectedProducts: 8,
          totalOrders: 89,
          pendingOrders: 23,
          completedOrders: 66,
          cancelledOrders: 0,
          totalRevenue: 15420.50,
          monthlyRevenue: 1250.00,
          weeklyRevenue: 300.00,
          totalCustomers: 45,
          averageRating: 4.3,
          totalReviews: 67,
          monthlyGrowth: 12.5,
          lowStockProducts: 5
        };
      }
    });

    // Load notifications - handled by subscription in ngOnInit
  }

  refreshStats(): void {
    console.log('🔄 SellerHeader: Manual refresh requested...');
    this.loadHeaderStats();
  }

  // Simple test method to check if services are working
  testServices(): void {
    console.log('🧪 Testing all seller services individually...');
    
    // Test Products Service
    console.log('🔍 Testing Products Service...');
    this.productService.getAllForSeller().subscribe({
      next: (products) => {
        console.log('✅ Products Service Success:', products);
        console.log('📊 Products Count:', products.length);
        if (products.length > 0) {
          console.log('📋 First Product:', products[0]);
        }
      },
      error: (error) => {
        console.error('❌ Products Service Error:', error);
      }
    });

    // Test Orders Service
    console.log('🔍 Testing Orders Service...');
    this.sellerOrdersService.getSellerOrders().subscribe({
      next: (orders) => {
        console.log('✅ Orders Service Success:', orders);
        console.log('📊 Orders Count:', orders.length);
        if (orders.length > 0) {
          console.log('📋 First Order:', orders[0]);
        }
      },
      error: (error) => {
        console.error('❌ Orders Service Error:', error);
      }
    });

    // Test Dashboard Service
    console.log('🔍 Testing Dashboard Service...');
    this.sellerDashboardService.getDashboardStats().subscribe({
      next: (stats) => {
        console.log('✅ Dashboard Service Success:', stats);
        console.log('📊 Dashboard Stats:', stats);
      },
      error: (error) => {
        console.error('❌ Dashboard Service Error:', error);
      }
    });
  }

  private loadHeaderStats() {
    console.log('🔄 SellerHeader: Loading header stats...');
    this.isLoading = true;
    
    // Use the new getHeaderStats method from seller dashboard service
    this.sellerDashboardService.getHeaderStats().subscribe({
      next: (stats) => {
        console.log('📊 SellerHeader: Header stats received:', stats);
        
        this.headerStats = {
          totalProducts: stats.totalProducts,
          pendingOrders: stats.pendingOrders,
          totalEarnings: stats.totalEarnings,
          monthlyGrowth: stats.monthlyGrowth
        };
        
        console.log('📈 SellerHeader: Header stats updated:', this.headerStats);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ SellerHeader: Error loading header stats:', error);
        
        // Fallback to individual service calls
        console.log('🔄 SellerHeader: Trying fallback method...');
        forkJoin({
          products: this.productService.getAllForSeller(),
          orders: this.sellerOrdersService.getSellerOrders()
        }).subscribe({
          next: ({ products, orders }) => {
            console.log('📊 SellerHeader: Fallback data received:', { products: products.length, orders: orders.length });
            
            const totalProducts = products.length;
            const pendingOrders = orders.filter(order => 
              order.orderStatusHistory?.some(status => 
                status.orderStatus === 1 || status.orderStatus === 2
              )
            ).length;
            const totalEarnings = orders.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0);
            
            this.headerStats = {
              totalProducts,
              pendingOrders: pendingOrders,
              totalEarnings,
              monthlyGrowth: this.dashboardStats.monthlyGrowth || 0
            };
            
            console.log('📈 SellerHeader: Fallback header stats updated:', this.headerStats);
            this.isLoading = false;
          },
          error: (fallbackError) => {
            console.error('❌ SellerHeader: Fallback also failed:', fallbackError);
            this.isLoading = false;
          }
        });
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
    // Mark as read in local storage service
    this.localNotificationService.markAsRead(notificationId);
    
    // Update local state
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification && !notification.isRead) {
      notification.isRead = true;
      this.notificationCount = this.notifications.filter(n => !n.isRead).length;
    }
  }

  markAllAsRead() {
    if (this.currentSellerId) {
      // Mark all as read in local storage service
      this.localNotificationService.markAllAsRead('seller', this.currentSellerId);
      
      // Update local state
      this.notifications.forEach(n => n.isRead = true);
      this.notificationCount = 0;
    }
  }

  getSearchResultIcon(type: string): string {
    switch (type) {
      case 'product': return '📦';
      case 'order': return '📋';
      case 'customer': return '👤';
      default: return '📄';
    }
  }

  getNotificationIcon(type: NotificationType): string {
    return this.localNotificationService.getNotificationIcon(type);
  }

  getNotificationColorClass(type: NotificationType): string {
    return this.localNotificationService.getNotificationColorClass(type);
  }

  onNotificationClick(notification: LocalNotification): void {
    if (notification.actionUrl) {
      this.router.navigate([notification.actionUrl]);
    }
    if (!notification.isRead) {
      this.markNotificationAsRead(notification.id);
    }
  }

  logout(): void {
    this.auth.logout();
    this.showUserMenu = false;
    this.showNotifications = false;
    // Hard refresh to fully reset state and reload public products
    location.href = '/products';
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
      currency: 'EGP'
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

  private getInitials(name: string): string {
    const names = name.split(' ');
    if (names.length === 1) {
      return name.charAt(0).toUpperCase();
    } else {
      return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
    }
  }
} 