import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { OrderStatus } from '../models/i-order-status-history';
import { tap } from 'rxjs/operators';
import { LocalStorageNotificationService } from './local-storage-notification.service';

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
  private apiUrl = 'https://localhost:7253/api/Order';

  // No longer needed - using LocalStorageNotificationService instead
  // private sellerNotificationsSubject = new BehaviorSubject<AdminOrderNotification[]>([]);
  // public sellerNotifications$ = this.sellerNotificationsSubject.asObservable();

  constructor(
    private http: HttpClient,
    private localNotificationService: LocalStorageNotificationService
  ) {}

  getOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(this.apiUrl);
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
    return this.http.put<Order>(this.apiUrl, order).pipe(
      tap(response => {
        // Send notification to seller about order update
        this.notifySeller('order_updated', 'Order Updated', 
          `Admin has updated order #${order.id}`, 
          'seller-123', '/seller/orders', { orderId: order.id });
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
    return this.http.post<OrderStatusHistory>(`${this.apiUrl}/status-history`, statusHistory).pipe(
      tap(response => {
        // Send notification to seller about order status change
        this.notifySeller('order_status_changed', 'Order Status Changed', 
          `Order #${statusHistory.orderId} status changed to ${this.getStatusName(statusHistory.orderStatus)}`, 
          'seller-123', '/seller/orders', { 
            orderId: statusHistory.orderId, 
            newStatus: this.getStatusName(statusHistory.orderStatus) 
          });
      })
    );
  }

  updateOrderStatusHistory(statusHistory: OrderStatusHistoryUpdateDto): Observable<OrderStatusHistory> {
    return this.http.put<OrderStatusHistory>(`${this.apiUrl}/status-history`, statusHistory).pipe(
      tap(response => {
        // Send notification to seller about order status change
        this.notifySeller('order_status_changed', 'Order Status Changed', 
          `Order #${statusHistory.orderId} status changed to ${this.getStatusName(statusHistory.orderStatus)}`, 
          'seller-123', '/seller/orders', { 
            orderId: statusHistory.orderId, 
            newStatus: this.getStatusName(statusHistory.orderStatus) 
          });
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