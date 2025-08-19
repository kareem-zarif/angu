import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map, catchError, of, BehaviorSubject, tap, switchMap } from 'rxjs';
import { environment } from '../../environment/environment';
import { AdminProductsService } from './admin-products-service';
import { AdminOrdersService } from './admin-orders-service';
import { AdminSuppliersService } from './admin-suppliers.service';
import { AdminCustomersService } from './admin-customers-service';
import { AdminCategoriesService } from './admin-categories-service';
import { AdminSubCategoriesService } from './admin-subcategories-service';

export interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  activeCustomers: number;
  totalProducts: number;
  totalSuppliers: number;
  totalCategories: number;
  totalSubCategories: number;
  approvedProducts: number;
  pendingProducts: number;
  rejectedProducts: number;
  lowStockProducts: number;
  monthlyRevenue: number;
  weeklyOrders: number;
}

export interface RecentActivity {
  id: number;
  type: 'order' | 'customer' | 'product' | 'supplier' | 'category';
  title: string;
  description: string;
  time: string;
  status: 'pending' | 'completed' | 'failed';
  timestamp: Date;
}

export interface AdminHeaderStats {
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  activeCustomers: number;
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
  approvedProducts: number;
  pendingProducts: number;
  rejectedProducts: number;
  lowStockProducts: number;
  productsByCategory: { category: string; count: number }[];
  productsBySupplier: { supplier: string; count: number }[];
}

export interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  monthlyOrders: { month: string; count: number }[];
  revenueByMonth: { month: string; revenue: number }[];
}

export interface SupplierStats {
  totalSuppliers: number;
  activeSuppliers: number;
  suppliersByCategory: { category: string; count: number }[];
  topSuppliers: { name: string; productCount: number; revenue: number; ordersCount?: number }[];
}

@Injectable({
  providedIn: 'root'
})
export class AdminDashboardService {
  private apiUrl = environment.apiUrl;
  private dashboardStatsSubject = new BehaviorSubject<DashboardStats | null>(null);
  public dashboardStats$ = this.dashboardStatsSubject.asObservable();

  constructor(
    private http: HttpClient,
    private adminProductsService: AdminProductsService,
    private adminOrdersService: AdminOrdersService,
    private adminSuppliersService: AdminSuppliersService,
    private adminCustomersService: AdminCustomersService,
    private adminCategoriesService: AdminCategoriesService,
    private adminSubcategoriesService: AdminSubCategoriesService
  ) {
    // Test backend connectivity on service initialization
    this.testBackendConnectivity();
  }

  // Test if backend is accessible
  private testBackendConnectivity(): void {
    console.log('🔍 Testing backend connectivity...');
    console.log('🌐 Environment API URL:', environment.apiUrl);
    
    // Try to access a simple endpoint to test connectivity
    this.http.get(`${environment.apiUrl}/Product`).subscribe({
      next: (response) => {
        console.log('✅ Backend is accessible! Response:', response);
      },
      error: (error) => {
        console.error('❌ Backend is not accessible! Error:', error);
        console.error('🔧 Please check:');
        console.error('   1. Is your backend server running?');
        console.error('   2. Is it running on https://localhost:7253?');
        console.error('   3. Are there any CORS issues?');
        console.error('   4. Is the API endpoint correct?');
      }
    });
  }

  // Get comprehensive dashboard statistics from all services
  getDashboardStats(): Observable<DashboardStats> {
    console.log('🔄 AdminDashboardService: Starting to fetch dashboard stats...');
    
    // Test each service individually to identify which one is failing
    console.log('🔍 Testing individual services...');
    
    const products$ = this.adminProductsService.getAllProducts().pipe(
      tap(products => console.log('✅ Products service working, received:', products.length, 'products')),
      catchError(error => {
        console.error('❌ Products service failed:', error);
        return of([]);
      })
    );
    
    const orders$ = this.adminOrdersService.getOrders().pipe(
      tap(orders => console.log('✅ Orders service working, received:', orders.length, 'orders')),
      catchError(error => {
        console.error('❌ Orders service failed:', error);
        return of([]);
      })
    );
    
    const suppliers$ = this.adminSuppliersService.getAll().pipe(
      tap(suppliers => console.log('✅ Suppliers service working, received:', suppliers.length, 'suppliers')),
      catchError(error => {
        console.error('❌ Suppliers service failed:', error);
        return of([]);
      })
    );
    
    const customers$ = this.adminCustomersService.getCustomers().pipe(
      tap(customers => console.log('✅ Customers service working, received:', customers.length, 'customers')),
      catchError(error => {
        console.error('❌ Customers service failed:', error);
        return of([]);
      })
    );
    
    const categories$ = this.adminCategoriesService.getCategories().pipe(
      tap(categories => console.log('✅ Categories service working, received:', categories.length, 'categories')),
      catchError(error => {
        console.error('❌ Categories service failed:', error);
        return of([]);
      })
    );
    
    const subcategories$ = this.adminSubcategoriesService.getSubCategories().pipe(
      tap(subcategories => console.log('✅ Subcategories service working, received:', subcategories.length, 'subcategories')),
      catchError(error => {
        console.error('❌ Subcategories service failed:', error);
        return of([]);
      })
    );
    
    return forkJoin({
      products: products$,
      orders: orders$,
      suppliers: suppliers$,
      customers: customers$,
      categories: categories$,
      subcategories: subcategories$
    }).pipe(
      map(data => {
        console.log('📊 AdminDashboardService: Raw data received:', data);
        
        const stats: DashboardStats = {
          totalOrders: data.orders.length,
          pendingOrders: data.orders.filter(order => 
            order.currentStatus === 1 || order.currentStatus === 2
          ).length,
          totalRevenue: data.orders.reduce((sum, order) => sum + order.totalAmount, 0),
          activeCustomers: data.customers.length,
          totalProducts: data.products.length,
          totalSuppliers: data.suppliers.length,
          totalCategories: data.categories.length,
          totalSubCategories: data.subcategories.length,
          approvedProducts: data.products.filter(p => p.approvalStatus === 2).length,
          pendingProducts: data.products.filter(p => p.approvalStatus === 1).length,
          rejectedProducts: data.products.filter(p => p.approvalStatus === 3).length,
          lowStockProducts: data.products.filter(p => p.noINStock < 10).length,
          monthlyRevenue: this.calculateMonthlyRevenue(data.orders),
          weeklyOrders: this.calculateWeeklyOrders(data.orders)
        };
        
        console.log('📈 AdminDashboardService: Calculated stats:', stats);
        this.dashboardStatsSubject.next(stats);
        return stats;
      }),
      catchError(error => {
        console.error('❌ AdminDashboardService: Error loading dashboard stats:', error);
        // Return fallback data
        return of({
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
        });
      })
    );
  }

  // Get product statistics with charts data
  getProductStats(): Observable<ProductStats> {
    return forkJoin({
      products: this.adminProductsService.getAllProducts(),
      categories: this.adminCategoriesService.getCategories(),
      suppliers: this.adminSuppliersService.getAll()
    }).pipe(
      map(data => {
        const productsByCategory = this.groupProductsByCategory(data.products, data.categories);
        const productsBySupplier = this.groupProductsBySupplier(data.products, data.suppliers);

        return {
          totalProducts: data.products.length,
                  approvedProducts: data.products.filter(p => p.approvalStatus === 2).length,
        pendingProducts: data.products.filter(p => p.approvalStatus === 1).length,
        rejectedProducts: data.products.filter(p => p.approvalStatus === 3).length,
          lowStockProducts: data.products.filter(p => p.noINStock < 10).length,
          productsByCategory,
          productsBySupplier
        };
      })
    );
  }

  // Get order statistics with charts data
  getOrderStats(): Observable<OrderStats> {
    return this.adminOrdersService.getOrders().pipe(
      map(orders => {
        const monthlyOrders = this.groupOrdersByMonth(orders);
        const revenueByMonth = this.groupRevenueByMonth(orders);

        return {
          totalOrders: orders.length,
                          pendingOrders: orders.filter(order => 
          order.currentStatus === 1 || order.currentStatus === 2
        ).length,
        completedOrders: orders.filter(order => 
          order.currentStatus === 4
        ).length,
        cancelledOrders: orders.filter(order => 
          order.currentStatus === 5
        ).length,
          monthlyOrders,
          revenueByMonth
        };
      })
    );
  }

  // Get supplier statistics with charts data
  getSupplierStats(): Observable<SupplierStats> {
    return forkJoin({
      suppliers: this.adminSuppliersService.getAllWithProductCounts(), // ← Use this method to get suppliers with product counts
      products: this.adminProductsService.getAllProducts(),
      orders: this.adminOrdersService.getOrders()
    }).pipe(
      map(data => {
        console.log('🔍 AdminDashboardService: getSupplierStats data received:', {
          suppliersCount: data.suppliers.length,
          productsCount: data.products.length,
          ordersCount: data.orders.length,
          sampleOrder: data.orders[0] // Log first order for debugging
        });
        
        // Debug order structure
        if (data.orders.length > 0) {
          const sampleOrder = data.orders[0];
          console.log('🔍 AdminDashboardService: Sample order structure:', {
            id: sampleOrder.id,
            totalAmount: sampleOrder.totalAmount,
            hasOrderItems: !!sampleOrder.orderItems,
            orderItemsCount: sampleOrder.orderItems?.length || 0,
            sampleOrderItem: sampleOrder.orderItems?.[0],
            orderKeys: Object.keys(sampleOrder) // See all available properties
          });
          
          // Check if orderItems might be named differently
          if (sampleOrder.orderItems) {
            console.log('🔍 AdminDashboardService: OrderItems structure:', sampleOrder.orderItems);
            if (sampleOrder.orderItems.length > 0) {
              console.log('🔍 AdminDashboardService: First orderItem structure:', {
                keys: Object.keys(sampleOrder.orderItems[0]),
                productId: sampleOrder.orderItems[0].productId,
                quantity: sampleOrder.orderItems[0].quantity
              });
            }
          }
        }
        
        const suppliersByCategory = this.groupSuppliersByCategory(data.suppliers);
        const topSuppliers = this.getTopSuppliers(data.suppliers, data.products, data.orders);

        console.log('🔍 AdminDashboardService: Top suppliers calculated:', topSuppliers);

        return {
          totalSuppliers: data.suppliers.length,
          activeSuppliers: data.suppliers.length,
          suppliersByCategory,
          topSuppliers
        };
      })
    );
  }

  // New method to get detailed supplier stats with individual order data
  getDetailedSupplierStats(): Observable<SupplierStats> {
    return this.adminSuppliersService.getAllWithProductCounts().pipe(
      switchMap(suppliers => {
        // Get orders for each supplier individually
        const supplierStatsPromises = suppliers.map(supplier => 
          this.adminSuppliersService.getSupplierOrders(supplier.id).pipe(
            map(orders => ({
              supplier,
              orders,
              revenue: orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0)
            }))
          )
        );
        
        return forkJoin(supplierStatsPromises);
      }),
      map(supplierStats => {
        console.log('🔍 AdminDashboardService: Detailed supplier stats calculated:', supplierStats);
        
        const topSuppliers = supplierStats
          .map(stat => ({
            name: `${stat.supplier.firstName} ${stat.supplier.lastName}`,
            productCount: stat.supplier.productSuppliers ? stat.supplier.productSuppliers.length : 0,
            revenue: stat.revenue,
            ordersCount: stat.orders.length
          }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5);

        // Get suppliers from the first stat to calculate categories
        const suppliers = supplierStats.map(stat => stat.supplier);
        const suppliersByCategory = this.groupSuppliersByCategory(suppliers);

        return {
          totalSuppliers: suppliers.length,
          activeSuppliers: suppliers.length,
          suppliersByCategory,
          topSuppliers
        };
      })
    );
  }

  // Get recent activities from all services
  getRecentActivities(): Observable<RecentActivity[]> {
    return forkJoin({
      products: this.adminProductsService.getAllProducts(),
      orders: this.adminOrdersService.getOrders(),
      customers: this.adminCustomersService.getCustomers(),
      suppliers: this.adminSuppliersService.getAllWithProductCounts() // ← Use this method for consistency
    }).pipe(
      map(data => {
        const activities: RecentActivity[] = [];

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
              status: product.approvalStatus === 2 ? 'completed' : product.approvalStatus === 1 ? 'pending' : 'failed',
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
              status: order.currentStatus === 4 ? 'completed' : 
                     order.currentStatus === 5 ? 'failed' : 'pending',
              timestamp: new Date()
            });
          });

        // Add recent customers
        data.customers
          .slice(0, 3)
          .forEach(customer => {
            activities.push({
              id: parseInt(customer.id),
              type: 'customer',
              title: 'New Customer Registration',
              description: `${customer.firstName} ${customer.lastName} registered`,
              time: 'Recently',
              status: 'completed',
              timestamp: new Date()
            });
          });

        // Add recent suppliers
        data.suppliers
          .slice(0, 3)
          .forEach(supplier => {
            activities.push({
              id: parseInt(supplier.id),
              type: 'supplier',
              title: 'New Supplier Added',
              description: `${supplier.firstName} ${supplier.lastName} (${supplier.factoryName}) added to platform`,
              time: 'Recently',
              status: 'completed',
              timestamp: new Date()
            });
          });

        // Return top 10 activities
        return activities.slice(0, 10);
      })
    );
  }

  // Get chart data for products
  getProductChartData(): Observable<ChartData> {
    return this.getProductStats().pipe(
      map(stats => ({
        labels: ['Approved', 'Pending', 'Rejected', 'Low Stock'],
        datasets: [{
          label: 'Products by Status',
          data: [
            stats.approvedProducts,
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
    return this.getOrderStats().pipe(
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

  private calculateWeeklyOrders(orders: any[]): number {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    return orders
      .filter(order => new Date(order.createdOn || '') >= oneWeekAgo)
      .length;
  }

  private groupProductsByCategory(products: any[], categories: any[]): { category: string; count: number }[] {
    const categoryMap = new Map<string, number>();
    
    products.forEach(product => {
      const category = categories.find(c => c.id === product.subCategoryId)?.name || 'Unknown';
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
    });
    
    return Array.from(categoryMap.entries()).map(([category, count]) => ({ category, count }));
  }

  private groupProductsBySupplier(products: any[], suppliers: any[]): { supplier: string; count: number }[] {
    const supplierMap = new Map<string, number>();
    
    products.forEach(product => {
      const supplier = suppliers.find(s => s.id === product.supplierId)?.name || 'Unknown';
      supplierMap.set(supplier, (supplierMap.get(supplier) || 0) + 1);
    });
    
    return Array.from(supplierMap.entries()).map(([supplier, count]) => ({ supplier, count }));
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

  private groupSuppliersByCategory(suppliers: any[]): { category: string; count: number }[] {
    const categoryMap = new Map<string, number>();
    
    suppliers.forEach(supplier => {
      const category = supplier.category?.name || 'Unknown';
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
    });
    
    return Array.from(categoryMap.entries()).map(([category, count]) => ({ category, count }));
  }

  private getTopSuppliers(suppliers: any[], products: any[], orders: any[]): { name: string; productCount: number; revenue: number }[] {
    console.log('🔍 getTopSuppliers: Starting calculation with:', {
      suppliersCount: suppliers.length,
      productsCount: products.length,
      ordersCount: orders.length
    });
    
    // Debug: Log all orders to see their structure
    console.log('🔍 getTopSuppliers: All orders received:', orders);
    
    // Test: Create a sample order to test the logic
    if (orders.length === 0) {
      console.log('⚠️ getTopSuppliers: No orders received, creating test data to verify logic');
      const testOrder = {
        id: 'test-order-1',
        totalAmount: 100,
        orderItems: [
          { productId: 'test-product-1', quantity: 2, pricePerPiece: 50 }
        ]
      };
      orders = [testOrder];
      console.log('🔍 getTopSuppliers: Test order created:', testOrder);
    }
    
    return suppliers.map(supplier => {
      try {
        // Use the productSuppliers data that's already included in the supplier object
        const supplierProductCount = supplier.productSuppliers ? supplier.productSuppliers.length : 0;
        
        // Get the actual product IDs for this supplier
        const supplierProductIds = supplier.productSuppliers ? supplier.productSuppliers.map((ps: any) => ps.productId) : [];
        
        console.log(`🔍 getTopSuppliers: Supplier ${supplier.firstName} ${supplier.lastName}:`, {
          productCount: supplierProductCount,
          productIds: supplierProductIds,
          supplierId: supplier.id
        });
        
        // Debug: Check if we have any orders at all
        if (orders.length === 0) {
          console.log('⚠️ getTopSuppliers: No orders received from backend');
          return {
            name: `${supplier.firstName} ${supplier.lastName}`,
            productCount: supplierProductCount,
            revenue: 0
          };
        }
        
        // Calculate revenue from orders containing this supplier's products
        const supplierOrders = orders.filter(o => {
          // Check if order has orderItems and they're valid
          if (!o.orderItems || !Array.isArray(o.orderItems)) {
            console.log(`⚠️ getTopSuppliers: Order ${o.id} has no orderItems or invalid structure:`, o.orderItems);
            return false;
          }
          
          // Debug: Log the order being processed
          console.log(`🔍 getTopSuppliers: Processing order ${o.id}:`, {
            orderItems: o.orderItems,
            totalAmount: o.totalAmount
          });
          
          return o.orderItems.some((item: any) => {
            if (!item || !item.productId) {
              console.log(`⚠️ getTopSuppliers: OrderItem has no productId:`, item);
              return false;
            }
            
            const isMatch = supplierProductIds.includes(item.productId);
            console.log(`🔍 getTopSuppliers: Checking if productId ${item.productId} matches supplier ${supplier.firstName}: ${isMatch}`);
            return isMatch;
          });
        });
        
        console.log(`🔍 getTopSuppliers: Supplier ${supplier.firstName} orders found:`, supplierOrders.length);
        
        const revenue = supplierOrders.reduce((sum, order) => {
          const amount = order.totalAmount || 0;
          console.log(`🔍 getTopSuppliers: Processing order ${order.id} with totalAmount: ${amount}`);
          return sum + amount;
        }, 0);
        
        console.log(`🔍 getTopSuppliers: Supplier ${supplier.firstName} final revenue: ${revenue}`);
        
        return {
          name: `${supplier.firstName} ${supplier.lastName}`,
          productCount: supplierProductCount,
          revenue
        };
      } catch (error) {
        console.error(`❌ getTopSuppliers: Error processing supplier ${supplier.firstName}:`, error);
        return {
          name: `${supplier.firstName} ${supplier.lastName}`,
          productCount: 0,
          revenue: 0
        };
      }
    }).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }

  private getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return `${Math.floor(diffInSeconds / 2592000)} months ago`;
  }

  // Legacy methods for backward compatibility
  getHeaderStats(): Observable<AdminHeaderStats> {
    return this.getDashboardStats().pipe(
      map(stats => ({
        totalOrders: stats.totalOrders,
        pendingOrders: stats.pendingOrders,
        totalRevenue: stats.totalRevenue,
        activeCustomers: stats.activeCustomers
      }))
    );
  }

  searchGlobal(query: string): Observable<any[]> {
    return forkJoin({
      products: this.adminProductsService.getAllProducts(),
      orders: this.adminOrdersService.getOrders(),
      customers: this.adminCustomersService.getCustomers(),
      suppliers: this.adminSuppliersService.getAllWithProductCounts() // ← Use this method for consistency
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
        
        // Search in customers
        data.customers
          .filter(c => `${c.firstName} ${c.lastName}`.toLowerCase().includes(query.toLowerCase()))
          .forEach(c => results.push({ type: 'customer', item: c }));
        
        // Search in suppliers
        data.suppliers
          .filter(s => `${s.firstName} ${s.lastName}`.toLowerCase().includes(query.toLowerCase()))
          .forEach(s => results.push({ type: 'supplier', item: s }));
        
        return results.slice(0, 10);
      })
    );
  }

  getNotifications(): Observable<any[]> {
    return of([]); // Implement if needed
  }
} 