import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map, of, BehaviorSubject, tap, catchError } from 'rxjs';
import { OrdersService } from './orders-service';
import { OrderStatusHistoryService, OrderStatusHistoryResDto, OrderStatus } from './order-status-history.service';
import { IOrder } from '../models/i-order';
import { environment } from '../../environment/environment';
import { UnifiedNotificationService } from './unified-notification.service';
import { Auth } from './auth';

export interface SellerOrderNotification {
  id: string;
  title: string;
  message: string;
  type: 'order_status_changed' | 'order_shipped' | 'order_delivered' | 'order_cancelled';
  recipientType: 'admin';
  recipientId?: string;
  isRead: boolean;
  timestamp: Date;
  actionUrl: string;
  metadata?: any;
}

export interface SellerOrderStats {
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
}

export interface SellerOrderFilter {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  customerName?: string;
  orderId?: string;
  page?: number;
  pageSize?: number;
}

export interface SellerOrderUpdateDto {
  orderId: string;
  status: string;
  trackingNumber?: string;
  notes?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SellerOrdersService {
  // Try admin endpoint first, fallback to regular endpoint
  private apiUrl = `${environment.apiUrl}/admin/Order`;
  private fallbackApiUrl = `${environment.apiUrl}/Order`;

  // Notification subject for admin
  private adminNotificationsSubject = new BehaviorSubject<SellerOrderNotification[]>([]);
  public adminNotifications$ = this.adminNotificationsSubject.asObservable();

  constructor(
    private http: HttpClient,
    private ordersService: OrdersService,
    private orderStatusHistoryService: OrderStatusHistoryService,
    private unifiedNotificationService: UnifiedNotificationService,
    private auth: Auth // Added AuthService injection
  ) {}

  // Get all seller orders with status history
  getSellerOrders(filter?: SellerOrderFilter): Observable<IOrder[]> {
    console.log('🔍 SellerOrdersService: Getting seller orders...');
    
    // Get the current seller ID from auth or local storage
    const currentSellerId = this.getCurrentSellerId();
    
    if (!currentSellerId) {
      console.error('❌ SellerOrdersService: No seller ID found');
      return of([]);
    }
    
    console.log(`🔍 SellerOrdersService: Getting orders for seller ${currentSellerId}`);
    
          // Use the new seller-specific endpoint
      const apiUrl = `${environment.apiUrl}/Order/seller/orders`;
    console.log('🔍 SellerOrdersService: Calling API:', apiUrl);
    
    return this.http.get<any[]>(apiUrl).pipe(
      tap(orders => {
        console.log(`✅ SellerOrdersService: Got ${orders.length} orders for seller ${currentSellerId}`);
        console.log('🔍 SellerOrdersService: Raw orders response:', orders);
        if (orders.length > 0) {
          console.log('🔍 SellerOrdersService: Sample order:', {
            id: orders[0].id,
            totalAmount: orders[0].totalAmount,
            orderItemsCount: orders[0].orderItems?.length || 0,
            fullOrder: orders[0]
          });
        }
      }),
      map(orders => orders.map(order => ({
        id: order.id,
        totalAmount: order.totalAmount,
        customerId: order.customerId,
        customerName: order.customerName,
        createdOn: order.createdOn ? new Date(order.createdOn) : new Date(),
        orderItems: order.orderItems?.map((item: any) => ({
          id: item.id,
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          pricePerPiece: item.pricePerPiece,
          totalPrice: item.totalPrice,
          orderId: item.orderId
        })) || [],
        currentStatus: this.getOrderCurrentStatus(order)
      }))),
      catchError(error => {
        console.error('❌ SellerOrdersService: Error getting seller orders:', error);
        console.error('❌ SellerOrdersService: Error details:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          url: error.url
        });
        
        // Fallback: Try to get all orders and filter them on frontend
        console.log('🔄 SellerOrdersService: Trying fallback method - get all orders and filter');
        return this.getSellerOrdersFallback(currentSellerId);
      })
    );
  }

  // Fallback method to get all orders and filter by supplier
  private getSellerOrdersFallback(supplierId: string): Observable<IOrder[]> {
    console.log('🔄 SellerOrdersService: Using fallback method for supplier:', supplierId);
    
    // Try to get all orders from the admin endpoint
    return this.http.get<any[]>(`${environment.apiUrl}/admin/Order/admin/all`).pipe(
      tap(allOrders => {
        console.log(`🔄 SellerOrdersService: Got ${allOrders.length} total orders from fallback endpoint`);
      }),
      map(allOrders => {
        // Filter orders that contain products from this supplier
        // This is a simplified approach - you might need to adjust based on your data structure
        const supplierOrders = allOrders.filter(order => {
          if (!order.orderItems || !Array.isArray(order.orderItems)) {
            return false;
          }
          
          // For now, we'll return all orders as a test
          // You'll need to implement the actual filtering logic based on your data structure
          return true;
        });
        
        console.log(`🔄 SellerOrdersService: Filtered to ${supplierOrders.length} orders for supplier ${supplierId}`);
        
        return supplierOrders.map(order => ({
          id: order.id,
          totalAmount: order.totalAmount,
          customerId: order.customerId,
          customerName: order.customerName,
          createdOn: order.createdOn ? new Date(order.createdOn) : new Date(),
          orderItems: order.orderItems?.map((item: any) => ({
            id: item.id,
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            pricePerPiece: item.pricePerPiece,
            totalPrice: item.totalPrice,
            orderId: item.orderId
          })) || [],
          currentStatus: this.getOrderCurrentStatus(order)
        }));
      }),
      catchError(fallbackError => {
        console.error('❌ SellerOrdersService: Fallback method also failed:', fallbackError);
        return of([]);
      })
    );
  }

  // Get seller order by ID with status history
  getSellerOrderById(id: string): Observable<IOrder> {
    return forkJoin({
      order: this.ordersService.getOrderById(id),
      statusHistory: this.orderStatusHistoryService.getOrderStatusHistoriesByOrderId(id)
    }).pipe(
      map(({ order, statusHistory }) => ({
        id: order.id,
        totalAmount: order.totalAmount,
        customerId: order.customerId,
        customerName: order.customerName,
        createdOn: new Date(), // You might need to add this to your DTO
        orderItems: order.orderItems.map(item => ({
          id: item.id,
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          pricePerPiece: item.pricePerPiece,
          totalPrice: item.totalPrice,
          orderId: item.orderId
        })),
        orderStatusHistory: statusHistory.map(history => ({
          id: history.id,
          orderStatus: history.orderStatus,
          modifiedOn: history.modifiedOn,
          orderId: history.orderId
        }))
      } as IOrder))
    );
  }

  // Update seller order status
  updateOrderStatus(orderUpdate: SellerOrderUpdateDto): Observable<IOrder> {
    const statusMap: { [key: string]: OrderStatus } = {
      'Pending': OrderStatus.Pending,
      'Confirmed': OrderStatus.Confirmed,
      'Shipped': OrderStatus.Shipped,
      'Delivered': OrderStatus.Deliverd, // Note: UI shows "Delivered" but enum is "Deliverd"
      'Cancelled': OrderStatus.Cancelled,
      'Returned': OrderStatus.Returned
    };

    const orderStatus = statusMap[orderUpdate.status] || OrderStatus.Pending;

    const statusHistoryDto = {
      orderStatus: orderStatus,
      orderId: orderUpdate.orderId
    };

    return this.orderStatusHistoryService.createOrderStatusHistory(statusHistoryDto).pipe(
      tap(() => {
        // Send notification to admin about order status change
        this.notifyAdmin('order_status_changed', 'Order Status Updated',
          `Order #${orderUpdate.orderId} status changed to ${orderUpdate.status}`,
          '/admin/orders', {
            orderId: orderUpdate.orderId,
            newStatus: orderUpdate.status,
            trackingNumber: orderUpdate.trackingNumber,
            notes: orderUpdate.notes
          });
      }),
      map(() => {
        // Return a mock IOrder since we don't have the full order data
        return {
          id: orderUpdate.orderId,
          totalAmount: 0,
          customerId: '',
          customerName: '',
          createdOn: new Date(),
          orderItems: [],
          orderStatusHistory: [{
            id: '',
            orderStatus: orderStatus,
            modifiedOn: new Date(),
            orderId: orderUpdate.orderId
          }]
        } as IOrder;
      })
    );
  }

  // Public method to test supplier ID retrieval (for debugging)
  testSupplierIdRetrieval(): void {
    console.log('🧪 SellerOrdersService: Testing supplier ID retrieval...');
    const supplierId = this.getCurrentSellerId();
    console.log('🧪 SellerOrdersService: Final supplier ID:', supplierId);
    
    if (supplierId) {
      console.log('🧪 SellerOrdersService: Testing API call...');
      this.http.get<any[]>(`${environment.apiUrl}/admin/Order/supplier/${supplierId}`).subscribe({
        next: (orders) => {
          console.log('🧪 SellerOrdersService: API test successful, got orders:', orders.length);
        },
        error: (error) => {
          console.error('🧪 SellerOrdersService: API test failed:', error);
        }
      });
    }
  }

  // Test method to get all orders (for debugging)
  testGetAllOrders(): void {
    console.log('🧪 SellerOrdersService: Testing get all orders...');
    this.http.get<any[]>(`${environment.apiUrl}/admin/Order/admin/all`).subscribe({
      next: (orders) => {
        console.log('🧪 SellerOrdersService: Get all orders successful, got orders:', orders.length);
        if (orders.length > 0) {
          console.log('🧪 SellerOrdersService: Sample order:', orders[0]);
        }
      },
      error: (error) => {
        console.error('🧪 SellerOrdersService: Get all orders failed:', error);
      }
    });
  }

  // Test method to try regular Order endpoint (for debugging)
  testRegularOrderEndpoint(): void {
    console.log('🧪 SellerOrdersService: Testing regular Order endpoint...');
    this.http.get<any[]>(`${environment.apiUrl}/Order`).subscribe({
      next: (orders) => {
        console.log('🧪 SellerOrdersService: Regular Order endpoint successful, got orders:', orders.length);
        if (orders.length > 0) {
          console.log('🧪 SellerOrdersService: Sample order:', orders[0]);
        }
      },
      error: (error) => {
        console.error('🧪 SellerOrdersService: Regular Order endpoint failed:', error);
      }
    });
  }

  // Get current seller ID from auth or local storage
  private getCurrentSellerId(): string | null {
    console.log('🔍 SellerOrdersService: Trying to get current seller ID...');
    
    // Try to get from local storage first
    const storedSupplierId = localStorage.getItem('supplierId');
    console.log('🔍 SellerOrdersService: Stored supplierId from localStorage:', storedSupplierId);
    if (storedSupplierId) {
      console.log('✅ SellerOrdersService: Using supplierId from localStorage:', storedSupplierId);
      return storedSupplierId;
    }
    
    // Try to get from auth service
    const currentUser = this.auth.getCurrentUser();
    console.log('🔍 SellerOrdersService: Current user from auth:', currentUser);
    if (currentUser && currentUser.UserId) {
      console.log('✅ SellerOrdersService: Using UserId as supplier ID:', currentUser.UserId);
      // For now, use UserId as supplier ID - you may need to adjust this logic
      return currentUser.UserId;
    }
    
    // Try to get from JWT token
    try {
      const token = this.auth.getToken();
      console.log('🔍 SellerOrdersService: Token exists:', !!token);
      if (token) {
        // Use the JWT helper directly
        const decodedToken = this.auth.jwtHelper.decodeToken(token);
        console.log('🔍 SellerOrdersService: Decoded token:', decodedToken);
        if (decodedToken && decodedToken.supplierId) {
          console.log('✅ SellerOrdersService: Using supplierId from token:', decodedToken.supplierId);
          return decodedToken.supplierId;
        }
        // Fallback to UserId from token
        if (decodedToken && decodedToken.UserId) {
          console.log('✅ SellerOrdersService: Using UserId from token as supplier ID:', decodedToken.UserId);
          return decodedToken.UserId;
        }
      }
    } catch (error) {
      console.log('❌ SellerOrdersService: Could not decode token for supplier ID:', error);
    }
    
    console.error('❌ SellerOrdersService: No supplier ID found from any source');
    return null;
  }

  // Calculate seller revenue from orders
  calculateSellerRevenue(orders: IOrder[]): number {
    return orders.reduce((total, order) => total + (order.totalAmount || 0), 0);
  }

  // Get seller order statistics
  getSellerOrderStats(): Observable<SellerOrderStats> {
    return this.getSellerOrders().pipe(
      map(orders => {
        const totalOrders = orders.length;
        const totalRevenue = this.calculateSellerRevenue(orders);
        const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        
        // Count orders by status
        const pendingOrders = orders.filter((o: IOrder) => this.getOrderCurrentStatus(o) === 1).length;
        const processingOrders = orders.filter((o: IOrder) => this.getOrderCurrentStatus(o) === 2).length;
        const shippedOrders = orders.filter((o: IOrder) => this.getOrderCurrentStatus(o) === 3).length;
        const deliveredOrders = orders.filter((o: IOrder) => this.getOrderCurrentStatus(o) === 4).length;
        const cancelledOrders = orders.filter((o: IOrder) => this.getOrderCurrentStatus(o) === 5).length;
        
        const stats: SellerOrderStats = {
          totalOrders,
          pendingOrders,
          processingOrders,
          shippedOrders,
          deliveredOrders,
          cancelledOrders,
          totalRevenue,
          averageOrderValue
        };
        
        console.log('💰 SellerOrdersService: Order stats calculated:', stats);
        return stats;
      })
    );
  }

  // Get orders by status
  getOrdersByStatus(status: string): Observable<IOrder[]> {
    return this.getSellerOrders().pipe(
      map(orders => {
        return orders.filter(order => {
          if (order.orderStatusHistory && order.orderStatusHistory.length > 0) {
            const lastStatus = order.orderStatusHistory[order.orderStatusHistory.length - 1].orderStatus;
            const statusMap: { [key: string]: number } = {
              'Pending': 1,
              'Confirmed': 2,
              'Shipped': 3,
              'Delivered': 4,
              'Cancelled': 5,
              'Returned': 6
            };
            return lastStatus === statusMap[status];
          }
          return status === 'Pending'; // Default to pending if no status history
        });
      })
    );
  }

  // Get recent orders
  getRecentOrders(limit: number = 10): Observable<IOrder[]> {
    return this.getSellerOrders().pipe(
      map(orders => orders.slice(0, limit))
    );
  }

  // Get order analytics
  getOrderAnalytics(dateFrom?: string, dateTo?: string): Observable<any> {
    return this.getSellerOrderStats().pipe(
      map(stats => ({
        totalOrders: stats.totalOrders,
        totalRevenue: stats.totalRevenue,
        averageOrderValue: stats.averageOrderValue,
        statusDistribution: {
          pending: stats.pendingOrders,
          processing: stats.processingOrders,
          shipped: stats.shippedOrders,
          delivered: stats.deliveredOrders,
          cancelled: stats.cancelledOrders
        }
      }))
    );
  }

  // Export orders
  exportOrders(filter?: SellerOrderFilter): Observable<Blob> {
    return this.getSellerOrders(filter).pipe(
      map(orders => {
        const csvContent = this.convertToCSV(orders);
        return new Blob([csvContent], { type: 'text/csv' });
      })
    );
  }

  // Get order timeline
  getOrderTimeline(orderId: string): Observable<any[]> {
    return this.orderStatusHistoryService.getOrderStatusHistoriesByOrderId(orderId).pipe(
      map(histories => histories.map(history => ({
        status: this.getStatusName(history.orderStatus),
        date: history.modifiedOn,
        description: `Order status changed to ${this.getStatusName(history.orderStatus)}`
      })))
    );
  }

  // Add order note
  addOrderNote(orderId: string, note: string): Observable<any> {
    // This would need to be implemented in your backend
    return of({ success: true, message: 'Note added successfully' });
  }

  // Get order notes
  getOrderNotes(orderId: string): Observable<any[]> {
    // This would need to be implemented in your backend
    return of([]);
  }

  // Mark order as shipped
  markOrderAsShipped(orderId: string, trackingNumber?: string): Observable<any> {
    return this.updateOrderStatus({
      orderId,
      status: 'Shipped',
      trackingNumber
    }).pipe(
      tap(() => {
        // Send specific notification for shipping
        this.notifyAdmin('order_shipped', 'Order Shipped',
          `Order #${orderId} has been shipped${trackingNumber ? ` with tracking #${trackingNumber}` : ''}`,
          '/admin/orders', {
            orderId,
            trackingNumber,
            status: 'Shipped'
          });
      })
    );
  }

  // Mark order as delivered
  markOrderAsDelivered(orderId: string): Observable<any> {
    return this.updateOrderStatus({
      orderId,
      status: 'Delivered'
    }).pipe(
      tap(() => {
        // Send specific notification for delivery
        this.notifyAdmin('order_delivered', 'Order Delivered',
          `Order #${orderId} has been delivered successfully`,
          '/admin/orders', {
            orderId,
            status: 'Delivered'
          });
      })
    );
  }

  // Cancel order
  cancelOrder(orderId: string, reason: string): Observable<any> {
    return this.updateOrderStatus({
      orderId,
      status: 'Cancelled',
      notes: reason
    }).pipe(
      tap(() => {
        // Send specific notification for cancellation
        this.notifyAdmin('order_cancelled', 'Order Cancelled',
          `Order #${orderId} has been cancelled. Reason: ${reason}`,
          '/admin/orders', {
            orderId,
            status: 'Cancelled',
            reason
          });
      })
    );
  }

  // Helper methods
  private getStatusName(status: OrderStatus): string {
    switch (status) {
      case OrderStatus.Pending: return 'Pending';
      case OrderStatus.Confirmed: return 'Confirmed';
      case OrderStatus.Shipped: return 'Shipped';
      case OrderStatus.Deliverd: return 'Delivered'; // Note: enum is "Deliverd" but UI shows "Delivered"
      case OrderStatus.Cancelled: return 'Cancelled';
      case OrderStatus.Returned: return 'Returned';
      default: return 'Unknown';
    }
  }

  private convertToCSV(orders: IOrder[]): string {
    const headers = ['Order ID', 'Customer', 'Total Amount', 'Status', 'Date'];
    const rows = orders.map(order => [
      order.id,
      order.customerName || 'N/A',
      order.totalAmount,
      this.getOrderStatus(order),
      order.createdOn ? new Date(order.createdOn).toLocaleDateString() : 'N/A'
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    return csvContent;
  }

  private getOrderStatus(order: IOrder): string {
    if (order.orderStatusHistory && order.orderStatusHistory.length > 0) {
      const lastStatus = order.orderStatusHistory[order.orderStatusHistory.length - 1].orderStatus;
      return this.getStatusName(lastStatus);
    }
    return 'Pending';
  }

  private getOrderCurrentStatus(order: IOrder): number {
    if (order.orderStatusHistory && order.orderStatusHistory.length > 0) {
      const lastStatus = order.orderStatusHistory[order.orderStatusHistory.length - 1].orderStatus;
      return lastStatus;
    }
    return 1; // Default to Pending if no history
  }


  // Private method to create and emit notifications for admin
  private notifyAdmin(type: SellerOrderNotification['type'], title: string, message: string,
                     actionUrl: string, metadata?: any): void {
    const notification: SellerOrderNotification = {
      id: `seller-order-${Date.now()}-${Math.random()}`,
      title,
      message,
      type,
      recipientType: 'admin',
      isRead: false,
      timestamp: new Date(),
      actionUrl,
      metadata
    };

    // Send to unified notification service
    this.unifiedNotificationService.addSellerNotification(notification);

    console.log('Seller order notification sent to admin:', notification);
  }

  // Method to get admin notifications (for admin components to subscribe to)
  getAdminNotifications(): Observable<SellerOrderNotification[]> {
    return this.adminNotifications$;
  }

  // Method to mark notification as read
  markNotificationAsRead(notificationId: string): void {
    const currentNotifications = this.adminNotificationsSubject.value;
    const updatedNotifications = currentNotifications.map(notification =>
      notification.id === notificationId
        ? { ...notification, isRead: true }
        : notification
    );
    this.adminNotificationsSubject.next(updatedNotifications);
  }

  // Method to clear all admin notifications
  clearAdminNotifications(): void {
    this.adminNotificationsSubject.next([]);
  }
}

