import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map, catchError, of, BehaviorSubject } from 'rxjs';
import { environment } from '../../environment/environment';
import { ProductService } from './product-service';
import { SellerOrdersService } from './seller-orders.service';
import { Auth } from './auth';

export interface SellerDashboardStats {
  totalProducts: number;
  activeProducts: number;
  pendingProducts: number;
  rejectedProducts: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  monthlyRevenue: number;
  weeklyRevenue: number;
  totalCustomers: number;
  averageRating: number;
  totalReviews: number;
  monthlyGrowth: number;
  lowStockProducts: number;
}

export interface SellerRecentActivity {
  id: number;
  type: 'order' | 'product' | 'customer' | 'review' | 'payment';
  title: string;
  description: string;
  time: string;
  status: 'pending' | 'completed' | 'cancelled';
  amount?: number;
  timestamp: Date;
}

export interface SellerHeaderStats {
  totalProducts: number;
  pendingOrders: number;
  totalEarnings: number;
  monthlyGrowth: number;
}

export interface SellerNotification {
  id: string;
  title: string;
  message: string;
  type: 'order' | 'payment' | 'review' | 'stock' | 'system';
  isRead: boolean;
  timestamp: Date;
}

export interface SellerRecentOrder {
  id: string;
  customerName: string;
  amount: number;
  status: string;
  date: Date;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string[];
    borderColor?: string;
    borderWidth?: number;
  }[];
}

export interface ProductStats {
  totalProducts: number;
  activeProducts: number;
  pendingProducts: number;
  rejectedProducts: number;
  lowStockProducts: number;
  productsByCategory: { category: string; count: number }[];
  productsByStatus: { status: string; count: number }[];
}

export interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  monthlyOrders: { month: string; count: number }[];
  revenueByMonth: { month: string; revenue: number }[];
  averageOrderValue: number;
}

export interface RevenueStats {
  totalRevenue: number;
  monthlyRevenue: number;
  weeklyRevenue: number;
  revenueByMonth: { month: string; revenue: number }[];
  revenueByWeek: { week: string; revenue: number }[];
}

@Injectable({
  providedIn: 'root'
})
export class SellerDashboardService {
  private apiUrl = environment.apiUrl;
  private dashboardStatsSubject = new BehaviorSubject<SellerDashboardStats | null>(null);
  public dashboardStats$ = this.dashboardStatsSubject.asObservable();

  constructor(
    private http: HttpClient,
    private productService: ProductService,
    private sellerOrdersService: SellerOrdersService,
    private auth: Auth
  ) {}

  // Get comprehensive dashboard statistics from seller services
  getDashboardStats(): Observable<SellerDashboardStats> {
    return forkJoin({
      products: this.productService.getAllForSeller(),
      orders: this.sellerOrdersService.getSellerOrders(),
      orderStats: this.sellerOrdersService.getSellerOrderStats()
    }).pipe(
      map(data => {
        const stats: SellerDashboardStats = {
          totalProducts: data.products.length,
          activeProducts: data.products.filter(p => p.approvalStatus === 2).length,
          pendingProducts: data.products.filter(p => p.approvalStatus === 1).length,
          rejectedProducts: data.products.filter(p => p.approvalStatus === 3).length,
          totalOrders: data.orders.length,
          pendingOrders: data.orders.filter(order => 
            order.orderStatusHistory?.some(status => 
              status.orderStatus === 1 || status.orderStatus === 2
            )
          ).length,
          completedOrders: data.orders.filter(order => 
            order.orderStatusHistory?.some(status => 
              status.orderStatus === 4
            )
          ).length,
          cancelledOrders: data.orders.filter(order => 
            order.orderStatusHistory?.some(status => 
              status.orderStatus === 5
            )
          ).length,
          totalRevenue: data.orders.reduce((sum, order) => sum + order.totalAmount, 0),
          monthlyRevenue: this.calculateMonthlyRevenue(data.orders),
          weeklyRevenue: this.calculateWeeklyRevenue(data.orders),
          totalCustomers: this.getUniqueCustomers(data.orders),
          averageRating: this.calculateAverageRating(data.products),
          totalReviews: this.calculateTotalReviews(data.products),
          monthlyGrowth: this.calculateMonthlyGrowth(data.orders),
          lowStockProducts: data.products.filter(p => p.noINStock < 10).length
        };
        
        this.dashboardStatsSubject.next(stats);
        return stats;
      }),
      catchError(error => {
        console.error('Error loading seller dashboard stats:', error);
        // Return fallback data
        return of({
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
        });
      })
    );
  }

  // Get product statistics with charts data
  getProductStats(): Observable<ProductStats> {
    return forkJoin({
      products: this.productService.getAllForSeller()
    }).pipe(
      map(data => {
        const productsByCategory = this.groupProductsByCategory(data.products);
        const productsByStatus = this.groupProductsByStatus(data.products);

        return {
          totalProducts: data.products.length,
          activeProducts: data.products.filter(p => p.approvalStatus === 2).length,
          pendingProducts: data.products.filter(p => p.approvalStatus === 1).length,
          rejectedProducts: data.products.filter(p => p.approvalStatus === 3).length,
          lowStockProducts: data.products.filter(p => p.noINStock < 10).length,
          productsByCategory,
          productsByStatus
        };
      })
    );
  }

  // Get order statistics with charts data
  getOrderStats(): Observable<OrderStats> {
    return forkJoin({
      orders: this.sellerOrdersService.getSellerOrders(),
      orderStats: this.sellerOrdersService.getSellerOrderStats()
    }).pipe(
      map(data => {
        const monthlyOrders = this.groupOrdersByMonth(data.orders);
        const revenueByMonth = this.groupRevenueByMonth(data.orders);
        const averageOrderValue = data.orders.length > 0 
          ? data.orders.reduce((sum, order) => sum + order.totalAmount, 0) / data.orders.length 
          : 0;

        return {
          totalOrders: data.orders.length,
          pendingOrders: data.orders.filter(order => 
            order.orderStatusHistory?.some(status => 
              status.orderStatus === 1 || status.orderStatus === 2
            )
          ).length,
          completedOrders: data.orders.filter(order => 
            order.orderStatusHistory?.some(status => 
              status.orderStatus === 4
            )
          ).length,
          cancelledOrders: data.orders.filter(order => 
            order.orderStatusHistory?.some(status => 
              status.orderStatus === 5
            )
          ).length,
          monthlyOrders,
          revenueByMonth,
          averageOrderValue
        };
      })
    );
  }

  // Get revenue statistics with charts data
  getRevenueStats(): Observable<RevenueStats> {
    return this.sellerOrdersService.getSellerOrders().pipe(
      map(orders => {
        const revenueByMonth = this.groupRevenueByMonth(orders);
        const revenueByWeek = this.groupRevenueByWeek(orders);

        return {
          totalRevenue: orders.reduce((sum, order) => sum + order.totalAmount, 0),
          monthlyRevenue: this.calculateMonthlyRevenue(orders),
          weeklyRevenue: this.calculateWeeklyRevenue(orders),
          revenueByMonth,
          revenueByWeek
        };
      })
    );
  }

  // Get recent activities from seller services
  getRecentActivities(): Observable<SellerRecentActivity[]> {
    return forkJoin({
      products: this.productService.getAllForSeller(),
      orders: this.sellerOrdersService.getSellerOrders()
    }).pipe(
      map(data => {
        const activities: SellerRecentActivity[] = [];

        // Add recent products
        data.products
          .slice(0, 5)
          .forEach(product => {
            activities.push({
              id: parseInt(product.id),
              type: 'product',
              title: `Product ${product.approvalStatus === 2 ? 'Approved' : product.approvalStatus === 1 ? 'Pending' : 'Rejected'}`,
              description: `${product.name} - ${product.approvalStatus === 2 ? 'Approved' : product.approvalStatus === 1 ? 'Pending Review' : 'Rejected'}`,
              time: 'Recently',
              status: product.approvalStatus === 2 ? 'completed' : product.approvalStatus === 1 ? 'pending' : 'cancelled',
              timestamp: new Date()
            });
          });

        // Add recent orders
        data.orders
          .slice(0, 5)
          .forEach(order => {
            activities.push({
              id: parseInt(order.id),
              type: 'order',
              title: `New Order #${order.id}`,
              description: `Order placed by ${order.customerName || 'Customer'} - ${order.totalAmount} EGP`,
              time: 'Recently',
              amount: order.totalAmount,
              status: order.orderStatusHistory?.some(status => status.orderStatus === 4) ? 'completed' : 
                     order.orderStatusHistory?.some(status => status.orderStatus === 5) ? 'cancelled' : 'pending',
              timestamp: new Date()
            });
          });

        // Return top 10 activities
        return activities.slice(0, 10);
      })
    );
  }

  // Get recent orders
  getRecentOrders(): Observable<SellerRecentOrder[]> {
    return this.sellerOrdersService.getSellerOrders().pipe(
      map(orders => {
        return orders.slice(0, 5).map(order => ({
          id: order.id,
          customerName: order.customerName || 'Customer',
          amount: order.totalAmount,
          status: this.getOrderStatus(order),
          date: new Date()
        }));
      })
    );
  }

  // Get chart data for products
  getProductChartData(): Observable<ChartData> {
    return this.getProductStats().pipe(
      map(stats => ({
        labels: ['Active', 'Pending', 'Rejected', 'Low Stock'],
        datasets: [{
          label: 'Products by Status',
          data: [
            stats.activeProducts,
            stats.pendingProducts,
            stats.rejectedProducts,
            stats.lowStockProducts
          ],
          backgroundColor: ['#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
          borderWidth: 0
        }]
      }))
    );
  }

  // Get chart data for orders
  getOrderChartData(): Observable<ChartData> {
    return this.getOrderStats().pipe(
      map(stats => ({
        labels: ['Completed', 'Pending', 'Cancelled'],
        datasets: [{
          label: 'Orders by Status',
          data: [stats.completedOrders, stats.pendingOrders, stats.cancelledOrders],
          backgroundColor: ['#10B981', '#F59E0B', '#EF4444'],
          borderWidth: 0
        }]
      }))
    );
  }

  // Get chart data for monthly revenue
  getRevenueChartData(): Observable<ChartData> {
    return this.getRevenueStats().pipe(
      map(stats => ({
        labels: stats.revenueByMonth.map(item => item.month),
        datasets: [{
          label: 'Monthly Revenue (EGP)',
          data: stats.revenueByMonth.map(item => item.revenue),
          borderColor: '#3B82F6',
          backgroundColor: ['rgba(59, 130, 246, 0.1)'],
          borderWidth: 2
        }]
      }))
    );
  }

  // Get chart data for monthly orders
  getOrdersChartData(): Observable<ChartData> {
    return this.getOrderStats().pipe(
      map(stats => ({
        labels: stats.monthlyOrders.map(item => item.month),
        datasets: [{
          label: 'Monthly Orders',
          data: stats.monthlyOrders.map(item => item.count),
          borderColor: '#8B5CF6',
          backgroundColor: ['#8B5CF6'],
          borderWidth: 1
        }]
      }))
    );
  }

  // Helper methods
  private calculateMonthlyRevenue(orders: any[]): number {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    return orders
      .filter(order => new Date(order.createdOn || '') >= firstDayOfMonth)
      .reduce((sum, order) => sum + order.totalAmount, 0);
  }

  private calculateWeeklyRevenue(orders: any[]): number {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    return orders
      .filter(order => new Date(order.createdOn || '') >= oneWeekAgo)
      .reduce((sum, order) => sum + order.totalAmount, 0);
  }

  private getUniqueCustomers(orders: any[]): number {
    const customerIds = new Set(orders.map(order => order.customerId).filter(id => id));
    return customerIds.size;
  }

  private calculateAverageRating(products: any[]): number {
    const productsWithRating = products.filter(p => p.rating && p.rating > 0);
    if (productsWithRating.length === 0) return 0;
    
    const totalRating = productsWithRating.reduce((sum, product) => sum + product.rating, 0);
    return Math.round((totalRating / productsWithRating.length) * 10) / 10;
  }

  private calculateTotalReviews(products: any[]): number {
    // This would need to be implemented based on your review system
    return 0;
  }

  private calculateMonthlyGrowth(orders: any[]): number {
    // This would need to be implemented based on your growth calculation logic
    return 12.5; // Placeholder
  }

  private groupProductsByCategory(products: any[]): { category: string; count: number }[] {
    const categoryMap = new Map<string, number>();
    
    products.forEach(product => {
      const category = product.subCategoryId || 'Unknown';
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
    });
    
    return Array.from(categoryMap.entries()).map(([category, count]) => ({ category, count }));
  }

  private groupProductsByStatus(products: any[]): { status: string; count: number }[] {
    const statusMap = new Map<string, number>();
    
    products.forEach(product => {
      const status = product.approvalStatus === 2 ? 'Approved' : 
                    product.approvalStatus === 1 ? 'Pending' : 'Rejected';
      statusMap.set(status, (statusMap.get(status) || 0) + 1);
    });
    
    return Array.from(statusMap.entries()).map(([status, count]) => ({ status, count }));
  }

  private groupOrdersByMonth(orders: any[]): { month: string; count: number }[] {
    const monthMap = new Map<string, number>();
    
    orders.forEach(order => {
      const date = new Date(order.createdOn || '');
      const month = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      monthMap.set(month, (monthMap.get(month) || 0) + 1);
    });
    
    return Array.from(monthMap.entries()).map(([month, count]) => ({ month, count }));
  }

  private groupRevenueByMonth(orders: any[]): { month: string; revenue: number }[] {
    const monthMap = new Map<string, number>();
    
    orders.forEach(order => {
      const date = new Date(order.createdOn || '');
      const month = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      monthMap.set(month, (monthMap.get(month) || 0) + order.totalAmount);
    });
    
    return Array.from(monthMap.entries()).map(([month, revenue]) => ({ month, revenue }));
  }

  private groupRevenueByWeek(orders: any[]): { week: string; revenue: number }[] {
    const weekMap = new Map<string, number>();
    
    orders.forEach(order => {
      const date = new Date(order.createdOn || '');
      const week = `Week ${Math.ceil(date.getDate() / 7)} ${date.toLocaleDateString('en-US', { month: 'short' })}`;
      weekMap.set(week, (weekMap.get(week) || 0) + order.totalAmount);
    });
    
    return Array.from(weekMap.entries()).map(([week, revenue]) => ({ week, revenue }));
  }

  private getOrderStatus(order: any): string {
    if (order.orderStatusHistory?.some((status: any) => status.orderStatus === 4)) {
      return 'Delivered';
    } else if (order.orderStatusHistory?.some((status: any) => status.orderStatus === 5)) {
      return 'Cancelled';
    } else if (order.orderStatusHistory?.some((status: any) => status.orderStatus === 3)) {
      return 'Shipped';
    } else if (order.orderStatusHistory?.some((status: any) => status.orderStatus === 2)) {
      return 'Confirmed';
    } else {
      return 'Pending';
    }
  }

  // Legacy methods for backward compatibility
  getHeaderStats(): Observable<SellerHeaderStats> {
    return this.getDashboardStats().pipe(
      map(stats => ({
        totalProducts: stats.totalProducts,
        pendingOrders: stats.pendingOrders,
        totalEarnings: stats.totalRevenue,
        monthlyGrowth: stats.monthlyGrowth
      }))
    );
  }

  searchGlobal(query: string): Observable<any[]> {
    return forkJoin({
      products: this.productService.getAllForSeller(),
      orders: this.sellerOrdersService.getSellerOrders()
    }).pipe(
      map(data => {
        const results: any[] = [];
        
        // Search in products
        data.products
          .filter(p => p.name.toLowerCase().includes(query.toLowerCase()))
          .forEach(p => results.push({ type: 'product', item: p }));
        
        // Search in orders
        data.orders
          .filter(o => o.id.includes(query) || o.customerName?.toLowerCase().includes(query.toLowerCase()))
          .forEach(o => results.push({ type: 'order', item: o }));
        
        return results.slice(0, 10);
      })
    );
  }

  getNotifications(): Observable<SellerNotification[]> {
    return of([]); // Implement if needed
  }

  markNotificationAsRead(notificationId: string): Observable<any> {
    return of({}); // Implement if needed
  }

  markAllNotificationsAsRead(): Observable<any> {
    return of({}); // Implement if needed
  }

  getSellerProfile(): Observable<any> {
    return of({}); // Implement if needed
  }

  updateSellerProfile(profile: any): Observable<any> {
    return of({}); // Implement if needed
  }
} 