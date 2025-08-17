import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { OrderStatus } from '../models/i-order-status-history';
import { tap, catchError } from 'rxjs/operators';
import { LocalStorageNotificationService } from './local-storage-notification.service';
import { environment } from '../../environment/environment';

export interface AdminOrderNotification {
  id: string;
  title: string;
  message: string;
  type: 'order_created' | 'order_updated' | 'order_deleted' | 'order_status_changed';
  recipientType: 'seller';
  recipientId: string;
  isRead: boolean;
  timestamp: Date;
  actionUrl: string;
  metadata?: any;
}

export interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  isSample: boolean;
  productId: string;
  orderId?: string;
  productName?: string;
}

export interface Order {
  id: string;
  paymentMethodName?: number;
  customerName?: string;
  totalAmount: number;
  paymentMethodId?: string;
  customerId?: string;
  orderItems: OrderItem[];
  createdOn?: Date;
  currentStatus?: OrderStatus;
}

export interface OrderCreateDto {
  totalAmount: number;
  paymentMethodId?: string;
  customerId?: string;
  orderItems?: OrderItemCreateDto[];
}

export interface OrderUpdateDto extends OrderCreateDto {
  id: string;
  currentStatus?: OrderStatus;
}

export interface OrderItemCreateDto {
  quantity: number;
  unitPrice: number;
  isSample: boolean;
  productId: string;
  orderId?: string;
}

export interface OrderItemUpdateDto extends OrderItemCreateDto {
  id: string;
}

export interface OrderStatusHistory {
  id: string;
  orderStatus: OrderStatus;
  modifiedOn: Date;
  orderId: string;
}

export interface OrderStatusHistoryCreateDto {
  orderStatus: OrderStatus;
  orderId: string;
}

export interface OrderStatusHistoryUpdateDto {
  id: string;
  orderStatus: OrderStatus;
  orderId: string;
}

@Injectable({ providedIn: 'root' })
export class AdminOrdersService {
  // Try admin endpoint first, fallback to regular endpoint
  private apiUrl = `${environment.apiUrl}/admin/Order`;
  private fallbackApiUrl = `${environment.apiUrl}/Order`;

  // No longer needed - using LocalStorageNotificationService instead
  // private sellerNotificationsSubject = new BehaviorSubject<AdminOrderNotification[]>([]);
  // public sellerNotifications$ = this.sellerNotificationsSubject.asObservable();

  constructor(
    private http: HttpClient,
    private localNotificationService: LocalStorageNotificationService
  ) {}

  getOrders(): Observable<Order[]> {
    console.log('🔍 AdminOrdersService: Trying admin endpoint:', this.apiUrl);
    return this.http.get<Order[]>(this.apiUrl).pipe(
      tap(orders => console.log('✅ Admin endpoint successful, got orders:', orders.length)),
      catchError(error => {
        console.log('⚠️ Admin endpoint failed, trying fallback:', this.fallbackApiUrl);
        return this.http.get<Order[]>(this.fallbackApiUrl).pipe(
          tap(orders => console.log('✅ Fallback endpoint successful, got orders:', orders.length)),
          catchError(fallbackError => {
            console.error('❌ Both endpoints failed:', error, fallbackError);
            throw fallbackError;
          })
        );
      })
    );
  }

  getOrderById(id: string): Observable<Order> {
    return this.http.get<Order>(`${this.apiUrl}/${id}`);
  }

  createOrder(order: OrderCreateDto): Observable<Order> {
    return this.http.post<Order>(this.apiUrl, order).pipe(
      tap(response => {
        // Send notification to seller about new order
        this.notifySeller('order_created', 'New Order Created', 
          `Admin has created a new order with total amount: $${order.totalAmount}`, 
          'seller-123', '/seller/orders', { orderId: response.id, totalAmount: order.totalAmount });
      })
    );
  }

  updateOrder(order: OrderUpdateDto): Observable<Order> {
    console.log('🔍 AdminOrdersService: Updating order with ID:', order.id);
    console.log('🔍 AdminOrdersService: Update data:', order);
    
    // Remove currentStatus from the request body as it's not expected by the backend
    const { currentStatus, ...orderData } = order;
    
    console.log('🔍 AdminOrdersService: Trying admin endpoint first:', this.apiUrl);
    return this.http.put<Order>(this.apiUrl, orderData).pipe(
      tap(response => {
        console.log('✅ AdminOrdersService: Order updated successfully via admin endpoint:', response);
        // Send notification to seller about order update
        this.notifySeller('order_updated', 'Order Updated', 
          `Admin has updated order #${order.id}`, 
          'seller-123', '/seller/orders', { orderId: order.id });
      }),
      catchError(error => {
        console.log('⚠️ AdminOrdersService: Admin endpoint failed, trying fallback:', this.fallbackApiUrl);
        console.log('⚠️ AdminOrdersService: Error details:', error);
        
        return this.http.put<Order>(this.fallbackApiUrl, orderData).pipe(
          tap(response => {
            console.log('✅ AdminOrdersService: Order updated successfully via fallback endpoint:', response);
            // Send notification to seller about order update
            this.notifySeller('order_updated', 'Order Updated', 
              `Admin has updated order #${order.id}`, 
              'seller-123', '/seller/orders', { orderId: order.id });
          }),
          catchError(fallbackError => {
            console.error('❌ AdminOrdersService: Both endpoints failed:', error, fallbackError);
            throw fallbackError;
          })
        );
      })
    );
  }

  deleteOrder(id: string): Observable<Order> {
    return this.http.delete<Order>(`${this.apiUrl}/${id}`).pipe(
      tap(response => {
        // Send notification to seller about order deletion
        this.notifySeller('order_deleted', 'Order Deleted', 
          `Admin has deleted order #${id}`, 
          'seller-123', '/seller/orders', { orderId: id });
      })
    );
  }

  // Order Status History methods
  createOrderStatusHistory(statusHistory: OrderStatusHistoryCreateDto): Observable<OrderStatusHistory> {
    console.log('🔍 AdminOrdersService: Creating order status history:', statusHistory);
    
    // Try admin endpoint first, then fallback to regular OrderStatusHistory endpoint
    const adminUrl = `${this.apiUrl}/status-history`;
    const fallbackUrl = `${environment.apiUrl}/OrderStatusHistory`;
    
    console.log('🔍 AdminOrdersService: Trying admin endpoint first:', adminUrl);
    return this.http.post<OrderStatusHistory>(adminUrl, statusHistory).pipe(
      tap(response => {
        console.log('✅ AdminOrdersService: Status history created successfully via admin endpoint:', response);
        // Send notification to seller about order status change
        this.notifySeller('order_status_changed', 'Order Status Changed', 
          `Order #${statusHistory.orderId} status changed to ${this.getStatusName(statusHistory.orderStatus)}`, 
          'seller-123', '/seller/orders', { 
            orderId: statusHistory.orderId, 
            newStatus: this.getStatusName(statusHistory.orderStatus) 
          });
      }),
      catchError(error => {
        console.log('⚠️ AdminOrdersService: Admin endpoint failed, trying fallback:', fallbackUrl);
        console.log('⚠️ AdminOrdersService: Error details:', error);
        
        return this.http.post<OrderStatusHistory>(fallbackUrl, statusHistory).pipe(
          tap(response => {
            console.log('✅ AdminOrdersService: Status history created successfully via fallback endpoint:', response);
            // Send notification to seller about order status change
            this.notifySeller('order_status_changed', 'Order Status Changed', 
              `Order #${statusHistory.orderId} status changed to ${this.getStatusName(statusHistory.orderStatus)}`, 
              'seller-123', '/seller/orders', { 
                orderId: statusHistory.orderId, 
                newStatus: this.getStatusName(statusHistory.orderStatus) 
              });
          }),
          catchError(fallbackError => {
            console.error('❌ AdminOrdersService: Both endpoints failed:', error, fallbackError);
            throw fallbackError;
          })
        );
      })
    );
  }



  updateOrderStatusHistory(statusHistory: OrderStatusHistoryUpdateDto): Observable<OrderStatusHistory> {
    console.log('🔍 AdminOrdersService: Updating order status history:', statusHistory);
    
    // Try admin endpoint first, then fallback to regular OrderStatusHistory endpoint
    const adminUrl = `${this.apiUrl}/status-history`;
    const fallbackUrl = `${environment.apiUrl}/OrderStatusHistory`;
    
    console.log('🔍 AdminOrdersService: Trying admin endpoint first:', adminUrl);
    return this.http.put<OrderStatusHistory>(adminUrl, statusHistory).pipe(
      tap(response => {
        console.log('✅ AdminOrdersService: Status history updated successfully via admin endpoint:', response);
        // Send notification to seller about order status change
        this.notifySeller('order_status_changed', 'Order Status Changed', 
          `Order #${statusHistory.orderId} status changed to ${this.getStatusName(statusHistory.orderStatus)}`, 
          'seller-123', '/seller/orders', { 
            orderId: statusHistory.orderId, 
            newStatus: this.getStatusName(statusHistory.orderStatus) 
          });
      }),
      catchError(error => {
        console.log('⚠️ AdminOrdersService: Admin endpoint failed, trying fallback:', fallbackUrl);
        console.log('⚠️ AdminOrdersService: Error details:', error);
        
        return this.http.put<OrderStatusHistory>(fallbackUrl, statusHistory).pipe(
          tap(response => {
            console.log('✅ AdminOrdersService: Status history updated successfully via fallback endpoint:', response);
            // Send notification to seller about order status change
            this.notifySeller('order_status_changed', 'Order Status Changed', 
              `Order #${statusHistory.orderId} status changed to ${this.getStatusName(statusHistory.orderStatus)}`, 
              'seller-123', '/seller/orders', { 
                orderId: statusHistory.orderId, 
                newStatus: this.getStatusName(statusHistory.orderStatus) 
              });
          }),
          catchError(fallbackError => {
            console.error('❌ AdminOrdersService: Both endpoints failed:', error, fallbackError);
            throw fallbackError;
          })
        );
      })
    );
  }

  deleteOrderStatusHistory(id: string): Observable<OrderStatusHistory> {
    return this.http.delete<OrderStatusHistory>(`${this.apiUrl}/status-history/${id}`);
  }

  // Private method to create and emit notifications
  private notifySeller(type: AdminOrderNotification['type'], title: string, message: string, 
                      recipientId: string, actionUrl: string, metadata?: any): void {
    // Create notification using local storage service
    this.localNotificationService.createNotification({
      title,
      message,
      type: type as any, // Cast to match the service interface
      recipientType: 'seller',
      recipientId,
      isRead: false,
      actionUrl,
      metadata
    });
    
    console.log('Admin order notification sent to seller via local storage:', { title, message, recipientId });
  }

  // These methods are no longer needed - use LocalStorageNotificationService instead
  // getSellerNotifications(): Observable<AdminOrderNotification[]> {
  //   return this.sellerNotifications$;
  // }

  // markNotificationAsRead(notificationId: string): void {
  //   this.localNotificationService.markAsRead(notificationId);
  // }

  // clearSellerNotifications(sellerId: string): void {
  //   this.localNotificationService.clearNotifications('seller', sellerId);
  // }

  // Helper method to get status name
  private getStatusName(status: OrderStatus): string {
    switch (status) {
      case OrderStatus.Pending: return 'Pending';
      case OrderStatus.Confirmed: return 'Confirmed';
      case OrderStatus.Shipped: return 'Shipped';
      case OrderStatus.Deliverd: return 'Delivered';
      case OrderStatus.Cancelled: return 'Cancelled';
      case OrderStatus.Returned: return 'Returned';
      default: return 'Unknown';
    }
  }
}