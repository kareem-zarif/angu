import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AdminDashboardService, AdminHeaderStats } from '../../services/admin-dashboard.service';
import { forkJoin, interval, Subscription as RxSubscription } from 'rxjs';
import { AdminOrdersService, Order, AdminOrderNotification } from '../../services/admin-orders-service';
import { AdminProductsService, AdminNotification } from '../../services/admin-products-service';
import { ProductApprovalStatus } from '../../models/i-product';
import { LocalStorageNotificationService, LocalNotification, NotificationType } from '../../services/local-storage-notification.service';
import { AdminSuppliersService, AdminSupplierNotification } from '../../services/admin-suppliers.service';
import { AdminCustomersService } from '../../services/admin-customers-service';
import { Auth } from '../../services/auth';
// import { environment } from '../../environment/environment';

@Component({
  selector: 'app-admin-header',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './admin-header.html',
  styleUrls: ['./admin-header.css']
})
export class AdminHeaderComponent implements OnInit, OnDestroy {
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

  notifications: LocalNotification[] = [];
  isLoading = false;
  private subscription = new Subscription();
  private refreshSubscription?: RxSubscription;

  constructor(
    private router: Router,
    private adminDashboardService: AdminDashboardService,
    private localNotificationService: LocalStorageNotificationService,
    private adminOrdersService: AdminOrdersService,
    private adminProductsService: AdminProductsService,
    private adminSuppliersService: AdminSuppliersService,
    private auth: Auth,
    private adminCustomersService: AdminCustomersService
  ) {}

  ngOnInit(): void {
    // Get admin name from auth service
    const adminName = this.auth.getSellerName() || this.auth.getCurrentUser()?.displayName;
    if (adminName) {
      this.adminUser.name = adminName;
    }
    
    // Subscribe to auth changes to update admin name
    this.subscription.add(
      this.auth.currentUser$.subscribe(user => {
        if (user) {
          const name = user.sellerName || user.displayName;
          if (name) {
            this.adminUser.name = name;
          }
        } else {
          this.adminUser.name = 'Guest';
        }
      })
    );
    
    this.loadHeaderStats();
    // Periodically refresh stats to keep navbar numbers in sync
    this.refreshSubscription = interval(30000).subscribe(() => this.loadHeaderStats());
    this.loadNotifications();
    
    // Subscribe to real-time notifications from local storage service
    this.subscription.add(
      this.localNotificationService.getAdminNotifications().subscribe(notifications => {
        this.notifications = notifications;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    this.refreshSubscription?.unsubscribe();
  }

  loadHeaderStats(): void {
    console.log('🔄 AdminHeader: Loading header stats...');
    console.log('🌐 Environment API URL: https://localhost:7253/api');
    this.isLoading = true;
    
    // Test each service individually to identify which one is failing
    console.log('🔍 Testing individual services...');
    
    // Test orders service first
    this.adminOrdersService.getOrders().subscribe({
      next: (orders) => {
        console.log('✅ Orders service working, received:', orders.length, 'orders');
        console.log('📋 Sample order data:', orders.slice(0, 2));
        
        // Test products service
        this.adminProductsService.getAllProducts().subscribe({
          next: (products) => {
            console.log('✅ Products service working, received:', products.length, 'products');
            
            // Test customers service
            this.adminCustomersService.getCustomers().subscribe({
              next: (customers) => {
                console.log('✅ Customers service working, received:', customers.length, 'customers');
                
                // Calculate stats
                const totalOrders = orders.length;
                const totalRevenue = orders.reduce((sum: number, o: Order) => sum + (o.totalAmount || 0), 0);
                
                // Calculate actual pending orders (status 1 or 2)
                const pendingOrders = orders.filter(order => 
                  order.currentStatus === 1 || order.currentStatus === 2
                ).length;
                
                const activeCustomers = customers.length;
                
                this.headerStats = {
                  totalOrders,
                  pendingOrders,
                  totalRevenue,
                  activeCustomers
                };
                
                console.log('📈 AdminHeader: Final calculated stats:', this.headerStats);
                this.isLoading = false;
              },
              error: (error) => {
                console.error('❌ Customers service failed:', error);
                this.isLoading = false;
              }
            });
          },
          error: (error) => {
            console.error('❌ Products service failed:', error);
            this.isLoading = false;
          }
        });
      },
      error: (error) => {
        console.error('❌ Orders service failed:', error);
        console.error('🔧 Orders service error details:', error);
        this.isLoading = false;
      }
    });
  }

  refreshStats(): void {
    console.log('🔄 AdminHeader: Manual refresh requested...');
    this.loadHeaderStats();
  }

  // Simple test method to check if services are working
  testServices(): void {
    console.log('🧪 Testing all services individually...');
    
    // Test Orders Service
    console.log('🔍 Testing Orders Service...');
    this.adminOrdersService.getOrders().subscribe({
      next: (orders) => {
        console.log('✅ Orders Service Success:', orders);
        console.log('📊 Orders Count:', orders.length);
        if (orders.length > 0) {
          console.log('📋 First Order:', orders[0]);
          console.log('💰 First Order Amount:', orders[0].totalAmount);
          console.log('📈 First Order Status:', orders[0].currentStatus);
        }
      },
      error: (error) => {
        console.error('❌ Orders Service Error:', error);
      }
    });

    // Test Products Service
    console.log('🔍 Testing Products Service...');
    this.adminProductsService.getAllProducts().subscribe({
      next: (products) => {
        console.log('✅ Products Service Success:', products);
        console.log('📊 Products Count:', products.length);
      },
      error: (error) => {
        console.error('❌ Products Service Error:', error);
      }
    });

    // Test Customers Service
    console.log('🔍 Testing Customers Service...');
    this.adminCustomersService.getCustomers().subscribe({
      next: (customers) => {
        console.log('✅ Customers Service Success:', customers);
        console.log('📊 Customers Count:', customers.length);
      },
      error: (error) => {
        console.error('❌ Customers Service Error:', error);
      }
    });
  }

  loadNotifications(): void {
    // Get notifications from local storage service
    this.localNotificationService.getAdminNotifications().subscribe({
      next: (notifications) => {
        this.notifications = notifications;
      },
      error: (error) => {
        console.error('Error loading notifications:', error);
        this.notifications = [];
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

  markAsRead(notificationId: string): void {
    this.localNotificationService.markAsRead(notificationId);
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.isRead = true;
    }
  }

  markAllAsRead(): void {
    this.localNotificationService.markAllAsRead('admin');
    this.notifications.forEach(notification => {
      notification.isRead = true;
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
    return this.notifications.filter(n => !n.isRead).length;
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

  getNotificationIcon(type: NotificationType): string {
    return this.localNotificationService.getNotificationIcon(type);
  }

  getNotificationColorClass(type: NotificationType): string {
    return this.localNotificationService.getNotificationColorClass(type);
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

  onNotificationClick(notification: LocalNotification): void {
    if (notification.actionUrl) {
      this.router.navigate([notification.actionUrl]);
    }
    if (!notification.isRead) {
      this.markAsRead(notification.id);
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }
}