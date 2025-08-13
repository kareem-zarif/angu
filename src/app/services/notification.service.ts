import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, interval } from 'rxjs';
import { tap, switchMap, catchError } from 'rxjs/operators';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  recipientType: 'admin' | 'seller';
  recipientId?: string; // For seller-specific notifications
  isRead: boolean;
  timestamp: Date;
  actionUrl?: string; // URL to navigate to when clicked
  metadata?: any; // Additional data like orderId, productId, etc.
}

export enum NotificationType {
  PRODUCT_APPROVED = 'product_approved',
  PRODUCT_REJECTED = 'product_rejected',
  PRODUCT_PENDING = 'product_pending',
  NEW_ORDER = 'new_order',
  ORDER_STATUS_CHANGED = 'order_status_changed',
  PAYMENT_RECEIVED = 'payment_received',
  LOW_STOCK = 'low_stock',
  NEW_CUSTOMER = 'new_customer',
  NEW_SUPPLIER = 'new_supplier',
  SYSTEM_ALERT = 'system_alert'
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: { [key in NotificationType]?: number };
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = 'https://localhost:7253/api/Notification';
  
  // Real-time notification streams
  private adminNotificationsSubject = new BehaviorSubject<Notification[]>([]);
  private sellerNotificationsSubject = new BehaviorSubject<Notification[]>([]);
  
  // Public observables
  public adminNotifications$ = this.adminNotificationsSubject.asObservable();
  public sellerNotifications$ = this.sellerNotificationsSubject.asObservable();

  constructor(private http: HttpClient) {
    // Start polling for new notifications every 30 seconds
    this.startNotificationPolling();
  }

  // Get notifications for admin
  getAdminNotifications(): Observable<Notification[]> {
    console.log('Fetching admin notifications from:', `${this.apiUrl}/admin`);
    return this.http.get<Notification[]>(`${this.apiUrl}/admin`).pipe(
      tap(raw => {
        const notifications = (raw || []).map(n => ({ ...n, timestamp: new Date(n.timestamp) }));
        console.log('Admin notifications received:', notifications);
        this.adminNotificationsSubject.next(notifications);
      }),
      catchError(error => {
        console.error('Error fetching admin notifications:', error);
        // Return mock data for testing when API is not available
        const mockNotifications: Notification[] = [
          {
            id: '1',
            title: 'New Product Pending Review',
            message: 'New product "Test Product" has been submitted for approval.',
            type: NotificationType.PRODUCT_PENDING,
            recipientType: 'admin',
            isRead: false,
            timestamp: new Date(Date.now() - 300000), // 5 minutes ago
            actionUrl: '/admin/products',
            metadata: { sellerId: 'seller-123', productName: 'Test Product' }
          }
        ];
        console.log('Using mock admin notifications:', mockNotifications);
        this.adminNotificationsSubject.next(mockNotifications);
        return [];
      })
    );
  }

  // Get notifications for a specific seller
  getSellerNotifications(sellerId: string): Observable<Notification[]> {
    console.log('Fetching seller notifications from:', `${this.apiUrl}/seller/${sellerId}`);
    return this.http.get<Notification[]>(`${this.apiUrl}/seller/${sellerId}`).pipe(
      tap(raw => {
        const notifications = (raw || []).map(n => ({ ...n, timestamp: new Date(n.timestamp) }));
        console.log('Seller notifications received:', notifications);
        this.sellerNotificationsSubject.next(notifications);
      }),
      catchError(error => {
        console.error('Error fetching seller notifications:', error);
        // Return mock data for testing when API is not available
        const mockNotifications: Notification[] = [
          {
            id: '1',
            title: 'Product Approved',
            message: 'Your product "Test Product" has been approved and is now live.',
            type: NotificationType.PRODUCT_APPROVED,
            recipientType: 'seller',
            recipientId: sellerId,
            isRead: false,
            timestamp: new Date(Date.now() - 600000), // 10 minutes ago
            actionUrl: '/seller/products'
          }
        ];
        console.log('Using mock seller notifications:', mockNotifications);
        this.sellerNotificationsSubject.next(mockNotifications);
        return [];
      })
    );
  }

  // Mark notification as read
  markAsRead(notificationId: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${notificationId}/read`, {});
  }

  // Mark all notifications as read
  markAllAsRead(recipientType: 'admin' | 'seller', recipientId?: string): Observable<void> {
    const url = recipientId 
      ? `${this.apiUrl}/${recipientType}/${recipientId}/read-all`
      : `${this.apiUrl}/${recipientType}/read-all`;
    return this.http.put<void>(url, {});
  }

  // Get notification statistics
  getNotificationStats(recipientType: 'admin' | 'seller', recipientId?: string): Observable<NotificationStats> {
    const url = recipientId 
      ? `${this.apiUrl}/stats/${recipientType}/${recipientId}`
      : `${this.apiUrl}/stats/${recipientType}`;
    return this.http.get<NotificationStats>(url);
  }

  // Create a new notification (for system events)
  createNotification(notification: Omit<Notification, 'id' | 'timestamp'>): Observable<Notification> {
    console.log('Creating notification:', notification);
    return this.http.post<Notification>(this.apiUrl, notification).pipe(
      tap(response => {
        const created: Notification = { ...response, timestamp: new Date((response as any).timestamp || Date.now()) };
        console.log('Notification created successfully:', created);
        if (created.recipientType === 'admin') {
          const curr = this.adminNotificationsSubject.value;
          this.adminNotificationsSubject.next([created, ...curr]);
        } else if (created.recipientType === 'seller') {
          const curr = this.sellerNotificationsSubject.value;
          this.sellerNotificationsSubject.next([created, ...curr]);
        }
      }),
      catchError(error => {
        console.error('Error creating notification:', error);
        // Create mock notification for testing when API is not available
        const mockNotification: Notification = {
          ...notification,
          id: `mock-${Date.now()}`,
          timestamp: new Date()
        };
        console.log('Created mock notification:', mockNotification);
        
        // Add to appropriate subject based on recipient type
        if (notification.recipientType === 'admin') {
          const currentNotifications = this.adminNotificationsSubject.value;
          this.adminNotificationsSubject.next([mockNotification, ...currentNotifications]);
        } else if (notification.recipientType === 'seller' && notification.recipientId) {
          const currentNotifications = this.sellerNotificationsSubject.value;
          this.sellerNotificationsSubject.next([mockNotification, ...currentNotifications]);
        }
        
        return [mockNotification];
      })
    );
  }

  // Delete a notification
  deleteNotification(notificationId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${notificationId}`);
  }

  // Start polling for new notifications
  private startNotificationPolling(): void {
    interval(30000).pipe( // Poll every 30 seconds
      switchMap(() => {
        // Poll for admin notifications
        return this.http.get<Notification[]>(`${this.apiUrl}/admin`).pipe(
          tap(notifications => {
            const currentNotifications = this.adminNotificationsSubject.value;
            if (JSON.stringify(notifications) !== JSON.stringify(currentNotifications)) {
              this.adminNotificationsSubject.next(notifications);
            }
          }),
          // Continue with seller notifications polling
          switchMap(() => {
            // Note: We can't poll for specific seller notifications here since we don't have the seller ID
            // The seller header component will handle its own polling
            return this.http.get<Notification[]>(`${this.apiUrl}/admin`); // Just return admin notifications
          })
        );
      })
    ).subscribe({
      error: (error) => {
        console.error('Error in notification polling:', error);
      }
    });
  }

  // Start seller-specific notification polling
  startSellerNotificationPolling(sellerId: string): void {
    interval(30000).pipe( // Poll every 30 seconds
      switchMap(() => {
        return this.http.get<Notification[]>(`${this.apiUrl}/seller/${sellerId}`).pipe(
          tap(notifications => {
            const currentNotifications = this.sellerNotificationsSubject.value;
            if (JSON.stringify(notifications) !== JSON.stringify(currentNotifications)) {
              this.sellerNotificationsSubject.next(notifications);
            }
          })
        );
      })
    ).subscribe({
      error: (error) => {
        console.error('Error in seller notification polling:', error);
      }
    });
  }

  // Helper methods to create specific notification types
  createProductApprovalNotification(sellerId: string, productName: string, isApproved: boolean): Observable<Notification> {
    const notification: Omit<Notification, 'id' | 'timestamp'> = {
      title: isApproved ? 'Product Approved' : 'Product Rejected',
      message: isApproved 
        ? `Your product "${productName}" has been approved and is now live.`
        : `Your product "${productName}" has been rejected. Please review and update.`,
      type: isApproved ? NotificationType.PRODUCT_APPROVED : NotificationType.PRODUCT_REJECTED,
      recipientType: 'seller',
      recipientId: sellerId,
      isRead: false,
      actionUrl: '/seller/products'
    };
    return this.createNotification(notification);
  }

  createNewProductNotification(sellerId: string, productName: string): Observable<Notification> {
    const notification: Omit<Notification, 'id' | 'timestamp'> = {
      title: 'New Product Pending Review',
      message: `New product "${productName}" has been submitted for approval.`,
      type: NotificationType.PRODUCT_PENDING,
      recipientType: 'admin',
      isRead: false,
      actionUrl: '/admin/products',
      metadata: { sellerId, productName }
    };
    return this.createNotification(notification);
  }

  createNewOrderNotification(sellerId: string, orderId: string, customerName: string): Observable<Notification> {
    const notification: Omit<Notification, 'id' | 'timestamp'> = {
      title: 'New Order Received',
      message: `New order #${orderId} from ${customerName}`,
      type: NotificationType.NEW_ORDER,
      recipientType: 'seller',
      recipientId: sellerId,
      isRead: false,
      actionUrl: `/seller/orders`,
      metadata: { orderId, customerName }
    };
    return this.createNotification(notification);
  }

  createOrderStatusChangeNotification(sellerId: string, orderId: string, newStatus: string): Observable<Notification> {
    const notification: Omit<Notification, 'id' | 'timestamp'> = {
      title: 'Order Status Updated',
      message: `Order #${orderId} status changed to ${newStatus}`,
      type: NotificationType.ORDER_STATUS_CHANGED,
      recipientType: 'seller',
      recipientId: sellerId,
      isRead: false,
      actionUrl: `/seller/orders`,
      metadata: { orderId, newStatus }
    };
    return this.createNotification(notification);
  }

  // Admin-facing notification when a seller updates an order status
  createOrderStatusChangeForAdmin(sellerId: string, orderId: string, newStatus: string): Observable<Notification> {
    const notification: Omit<Notification, 'id' | 'timestamp'> = {
      title: 'Order Status Updated',
      message: `Seller updated order #${orderId} to ${newStatus}`,
      type: NotificationType.ORDER_STATUS_CHANGED,
      recipientType: 'admin',
      isRead: false,
      actionUrl: '/admin/orders',
      metadata: { orderId, newStatus, sellerId }
    };
    return this.createNotification(notification);
  }

  createPaymentReceivedNotification(sellerId: string, orderId: string, amount: number): Observable<Notification> {
    const notification: Omit<Notification, 'id' | 'timestamp'> = {
      title: 'Payment Received',
      message: `Payment of $${amount.toFixed(2)} received for order #${orderId}`,
      type: NotificationType.PAYMENT_RECEIVED,
      recipientType: 'seller',
      recipientId: sellerId,
      isRead: false,
      actionUrl: `/seller/orders`,
      metadata: { orderId, amount }
    };
    return this.createNotification(notification);
  }

  createLowStockNotification(sellerId: string, productName: string, currentStock: number): Observable<Notification> {
    const notification: Omit<Notification, 'id' | 'timestamp'> = {
      title: 'Low Stock Alert',
      message: `Product "${productName}" is running low on stock (${currentStock} remaining)`,
      type: NotificationType.LOW_STOCK,
      recipientType: 'seller',
      recipientId: sellerId,
      isRead: false,
      actionUrl: '/seller/products',
      metadata: { productName, currentStock }
    };
    return this.createNotification(notification);
  }

  createNewCustomerNotification(customerName: string): Observable<Notification> {
    const notification: Omit<Notification, 'id' | 'timestamp'> = {
      title: 'New Customer Registration',
      message: `New customer "${customerName}" has registered`,
      type: NotificationType.NEW_CUSTOMER,
      recipientType: 'admin',
      isRead: false,
      actionUrl: '/admin/customers',
      metadata: { customerName }
    };
    return this.createNotification(notification);
  }

  createNewSupplierNotification(supplierName: string): Observable<Notification> {
    const notification: Omit<Notification, 'id' | 'timestamp'> = {
      title: 'New Supplier Registration',
      message: `New supplier "${supplierName}" has registered`,
      type: NotificationType.NEW_SUPPLIER,
      recipientType: 'admin',
      isRead: false,
      actionUrl: '/admin/suppliers',
      metadata: { supplierName }
    };
    return this.createNotification(notification);
  }

  // Get notification icon based on type
  getNotificationIcon(type: NotificationType): string {
    switch (type) {
      case NotificationType.PRODUCT_APPROVED:
        return '✅';
      case NotificationType.PRODUCT_REJECTED:
        return '❌';
      case NotificationType.PRODUCT_PENDING:
        return '⏳';
      case NotificationType.NEW_ORDER:
        return '🛒';
      case NotificationType.ORDER_STATUS_CHANGED:
        return '📦';
      case NotificationType.PAYMENT_RECEIVED:
        return '💰';
      case NotificationType.LOW_STOCK:
        return '⚠️';
      case NotificationType.NEW_CUSTOMER:
        return '👤';
      case NotificationType.NEW_SUPPLIER:
        return '🏭';
      case NotificationType.SYSTEM_ALERT:
        return '🚨';
      default:
        return '📢';
    }
  }

  // Get notification color class based on type
  getNotificationColorClass(type: NotificationType): string {
    switch (type) {
      case NotificationType.PRODUCT_APPROVED:
        return 'bg-green-100 text-green-800 border-green-200';
      case NotificationType.PRODUCT_REJECTED:
        return 'bg-red-100 text-red-800 border-red-200';
      case NotificationType.PRODUCT_PENDING:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case NotificationType.NEW_ORDER:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case NotificationType.ORDER_STATUS_CHANGED:
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case NotificationType.PAYMENT_RECEIVED:
        return 'bg-green-100 text-green-800 border-green-200';
      case NotificationType.LOW_STOCK:
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case NotificationType.NEW_CUSTOMER:
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case NotificationType.NEW_SUPPLIER:
        return 'bg-teal-100 text-teal-800 border-teal-200';
      case NotificationType.SYSTEM_ALERT:
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  // Toast notification methods for success and error messages
  showSuccess(message: string): void {
    // Create a temporary success notification
    const successNotification: Notification = {
      id: `success-${Date.now()}`,
      title: 'Success',
      message: message,
      type: NotificationType.PRODUCT_APPROVED, // Using existing type for styling
      recipientType: 'admin',
      isRead: false,
      timestamp: new Date(),
      actionUrl: undefined,
      metadata: { isToast: true, isSuccess: true }
    };

    // Add to admin notifications temporarily
    const currentNotifications = this.adminNotificationsSubject.value;
    this.adminNotificationsSubject.next([successNotification, ...currentNotifications]);

    // Remove after 3 seconds
    setTimeout(() => {
      const updatedNotifications = this.adminNotificationsSubject.value.filter(n => n.id !== successNotification.id);
      this.adminNotificationsSubject.next(updatedNotifications);
    }, 3000);
  }

  showError(message: string): void {
    // Create a temporary error notification
    const errorNotification: Notification = {
      id: `error-${Date.now()}`,
      title: 'Error',
      message: message,
      type: NotificationType.PRODUCT_REJECTED, // Using existing type for styling
      recipientType: 'admin',
      isRead: false,
      timestamp: new Date(),
      actionUrl: undefined,
      metadata: { isToast: true, isError: true }
    };

    // Add to admin notifications temporarily
    const currentNotifications = this.adminNotificationsSubject.value;
    this.adminNotificationsSubject.next([errorNotification, ...currentNotifications]);

    // Remove after 5 seconds (errors stay longer)
    setTimeout(() => {
      const updatedNotifications = this.adminNotificationsSubject.value.filter(n => n.id !== errorNotification.id);
      this.adminNotificationsSubject.next(updatedNotifications);
    }, 5000);
  }

  showInfo(message: string): void {
    // Create a temporary info notification
    const infoNotification: Notification = {
      id: `info-${Date.now()}`,
      title: 'Information',
      message: message,
      type: NotificationType.PRODUCT_PENDING, // Using existing type for styling
      recipientType: 'admin',
      isRead: false,
      timestamp: new Date(),
      actionUrl: undefined,
      metadata: { isToast: true, isInfo: true }
    };

    // Add to admin notifications temporarily
    const currentNotifications = this.adminNotificationsSubject.value;
    this.adminNotificationsSubject.next([infoNotification, ...currentNotifications]);

    // Remove after 4 seconds
    setTimeout(() => {
      const updatedNotifications = this.adminNotificationsSubject.value.filter(n => n.id !== infoNotification.id);
      this.adminNotificationsSubject.next(updatedNotifications);
    }, 4000);
  }
}
