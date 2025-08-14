import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, interval } from 'rxjs';
import { tap, map } from 'rxjs/operators';

export interface LocalNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  recipientType: 'admin' | 'seller';
  recipientId?: string; // For seller-specific notifications
  senderId?: string; // Who sent the notification
  isRead: boolean;
  timestamp: Date;
  actionUrl?: string; // URL to navigate to when clicked
  metadata?: any; // Additional data like orderId, productId, etc.
}

export enum NotificationType {
  // Product related
  PRODUCT_APPROVED = 'product_approved',
  PRODUCT_REJECTED = 'product_rejected',
  PRODUCT_PENDING = 'product_pending',
  PRODUCT_CREATED = 'product_created',
  PRODUCT_UPDATED = 'product_updated',
  PRODUCT_DELETED = 'product_deleted',
  LOW_STOCK = 'low_stock',
  
  // Order related
  NEW_ORDER = 'new_order',
  ORDER_STATUS_CHANGED = 'order_status_changed',
  ORDER_SHIPPED = 'order_shipped',
  ORDER_DELIVERED = 'order_delivered',
  ORDER_CANCELLED = 'order_cancelled',
  
  // Payment related
  PAYMENT_RECEIVED = 'payment_received',
  
  // User related
  NEW_CUSTOMER = 'new_customer',
  NEW_SUPPLIER = 'new_supplier',
  
  // System related
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
export class LocalStorageNotificationService {
  private readonly STORAGE_KEY = 'notifications';
  private readonly POLLING_INTERVAL = 5000; // 5 seconds
  
  // Real-time notification streams
  private adminNotificationsSubject = new BehaviorSubject<LocalNotification[]>([]);
  private sellerNotificationsSubject = new BehaviorSubject<LocalNotification[]>([]);
  
  // Public observables
  public adminNotifications$ = this.adminNotificationsSubject.asObservable();
  public sellerNotifications$ = this.sellerNotificationsSubject.asObservable();

  constructor() {
    this.initializeNotifications();
    this.startPolling();
  }

  private initializeNotifications(): void {
    // Load existing notifications from localStorage
    this.loadNotificationsFromStorage();
    
    // Initialize subjects with current data
    const allNotifications = this.getAllNotificationsFromStorage();
    const adminNotifications = allNotifications.filter(n => n.recipientType === 'admin');
    const sellerNotifications = allNotifications.filter(n => n.recipientType === 'seller');
    
    this.adminNotificationsSubject.next(adminNotifications);
    this.sellerNotificationsSubject.next(sellerNotifications);
  }

  private startPolling(): void {
    // Poll for changes every 5 seconds
    interval(this.POLLING_INTERVAL).subscribe(() => {
      this.loadNotificationsFromStorage();
    });
  }

  private loadNotificationsFromStorage(): void {
    const allNotifications = this.getAllNotificationsFromStorage();
    const adminNotifications = allNotifications.filter(n => n.recipientType === 'admin');
    const sellerNotifications = allNotifications.filter(n => n.recipientType === 'seller');
    
    // Only update if there are actual changes
    if (JSON.stringify(adminNotifications) !== JSON.stringify(this.adminNotificationsSubject.value)) {
      this.adminNotificationsSubject.next(adminNotifications);
    }
    
    if (JSON.stringify(sellerNotifications) !== JSON.stringify(this.sellerNotificationsSubject.value)) {
      this.sellerNotificationsSubject.next(sellerNotifications);
    }
  }

  private getAllNotificationsFromStorage(): LocalNotification[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const notifications = JSON.parse(stored);
        // Convert timestamp strings back to Date objects
        return notifications.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp)
        }));
      }
    } catch (error) {
      console.error('Error loading notifications from storage:', error);
    }
    return [];
  }

  private saveNotificationsToStorage(notifications: LocalNotification[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(notifications));
    } catch (error) {
      console.error('Error saving notifications to storage:', error);
    }
  }

  // Create a new notification
  createNotification(notification: Omit<LocalNotification, 'id' | 'timestamp'>): LocalNotification {
    const newNotification: LocalNotification = {
      ...notification,
      id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };

    const allNotifications = this.getAllNotificationsFromStorage();
    allNotifications.unshift(newNotification); // Add to beginning
    
    // Keep only last 100 notifications to prevent storage bloat
    if (allNotifications.length > 100) {
      allNotifications.splice(100);
    }
    
    this.saveNotificationsToStorage(allNotifications);
    
    // Update appropriate subject
    if (newNotification.recipientType === 'admin') {
      const currentAdminNotifications = this.adminNotificationsSubject.value;
      this.adminNotificationsSubject.next([newNotification, ...currentAdminNotifications]);
    } else if (newNotification.recipientType === 'seller') {
      const currentSellerNotifications = this.sellerNotificationsSubject.value;
      this.sellerNotificationsSubject.next([newNotification, ...currentSellerNotifications]);
    }

    return newNotification;
  }

  // Get notifications for admin
  getAdminNotifications(): Observable<LocalNotification[]> {
    return this.adminNotifications$;
  }

  // Get notifications for a specific seller
  getSellerNotifications(sellerId: string): Observable<LocalNotification[]> {
    return this.sellerNotifications$.pipe(
      map(notifications => notifications.filter(n => 
        n.recipientType === 'seller' && 
        (!n.recipientId || n.recipientId === sellerId)
      ))
    );
  }

  // Mark notification as read
  markAsRead(notificationId: string): void {
    const allNotifications = this.getAllNotificationsFromStorage();
    const notificationIndex = allNotifications.findIndex(n => n.id === notificationId);
    
    if (notificationIndex !== -1) {
      allNotifications[notificationIndex].isRead = true;
      this.saveNotificationsToStorage(allNotifications);
      
      // Update subjects
      this.loadNotificationsFromStorage();
    }
  }

  // Mark all notifications as read
  markAllAsRead(recipientType: 'admin' | 'seller', recipientId?: string): void {
    const allNotifications = this.getAllNotificationsFromStorage();
    
    allNotifications.forEach(notification => {
      if (notification.recipientType === recipientType) {
        if (!recipientId || notification.recipientId === recipientId) {
          notification.isRead = true;
        }
      }
    });
    
    this.saveNotificationsToStorage(allNotifications);
    this.loadNotificationsFromStorage();
  }

  // Delete a notification
  deleteNotification(notificationId: string): void {
    const allNotifications = this.getAllNotificationsFromStorage();
    const filteredNotifications = allNotifications.filter(n => n.id !== notificationId);
    
    this.saveNotificationsToStorage(filteredNotifications);
    this.loadNotificationsFromStorage();
  }

  // Clear all notifications for a recipient
  clearNotifications(recipientType: 'admin' | 'seller', recipientId?: string): void {
    const allNotifications = this.getAllNotificationsFromStorage();
    const filteredNotifications = allNotifications.filter(notification => {
      if (notification.recipientType === recipientType) {
        if (recipientId) {
          return notification.recipientId !== recipientId;
        }
        return false;
      }
      return true;
    });
    
    this.saveNotificationsToStorage(filteredNotifications);
    this.loadNotificationsFromStorage();
  }

  // Get notification statistics
  getNotificationStats(recipientType: 'admin' | 'seller', recipientId?: string): Observable<NotificationStats> {
    return new Observable(observer => {
      const allNotifications = this.getAllNotificationsFromStorage();
      let filteredNotifications = allNotifications.filter(n => n.recipientType === recipientType);
      
      if (recipientId) {
        filteredNotifications = filteredNotifications.filter(n => 
          !n.recipientId || n.recipientId === recipientId
        );
      }
      
      const total = filteredNotifications.length;
      const unread = filteredNotifications.filter(n => !n.isRead).length;
      
      const byType: { [key in NotificationType]?: number } = {};
      filteredNotifications.forEach(notification => {
        byType[notification.type] = (byType[notification.type] || 0) + 1;
      });
      
      observer.next({ total, unread, byType });
      observer.complete();
    });
  }

  // Helper methods to create specific notification types
  
  // Product approval notifications
  createProductApprovalNotification(sellerId: string, productName: string, isApproved: boolean): LocalNotification {
    return this.createNotification({
      title: isApproved ? 'Product Approved' : 'Product Rejected',
      message: isApproved 
        ? `Your product "${productName}" has been approved and is now live.`
        : `Your product "${productName}" has been rejected. Please review and update.`,
      type: isApproved ? NotificationType.PRODUCT_APPROVED : NotificationType.PRODUCT_REJECTED,
      recipientType: 'seller',
      recipientId: sellerId,
      isRead: false,
      actionUrl: '/seller/products',
      metadata: { productName, isApproved }
    });
  }

  // New product notification for admin
  createNewProductNotification(sellerId: string, productName: string): LocalNotification {
    return this.createNotification({
      title: 'New Product Pending Review',
      message: `New product "${productName}" has been submitted for approval.`,
      type: NotificationType.PRODUCT_PENDING,
      recipientType: 'admin',
      senderId: sellerId,
      isRead: false,
      actionUrl: '/admin/products',
      metadata: { sellerId, productName }
    });
  }

  // Product update notification
  createProductUpdateNotification(sellerId: string, productName: string): LocalNotification {
    return this.createNotification({
      title: 'Product Updated',
      message: `Product "${productName}" has been updated and requires re-approval.`,
      type: NotificationType.PRODUCT_UPDATED,
      recipientType: 'admin',
      senderId: sellerId,
      isRead: false,
      actionUrl: '/admin/products',
      metadata: { sellerId, productName }
    });
  }

  // Low stock notification
  createLowStockNotification(sellerId: string, productName: string, currentStock: number): LocalNotification {
    return this.createNotification({
      title: 'Low Stock Alert',
      message: `Product "${productName}" is running low on stock (${currentStock} remaining)`,
      type: NotificationType.LOW_STOCK,
      recipientType: 'seller',
      recipientId: sellerId,
      isRead: false,
      actionUrl: '/seller/products',
      metadata: { productName, currentStock }
    });
  }

  // New order notification
  createNewOrderNotification(sellerId: string, orderId: string, customerName: string): LocalNotification {
    return this.createNotification({
      title: 'New Order Received',
      message: `New order #${orderId} from ${customerName}`,
      type: NotificationType.NEW_ORDER,
      recipientType: 'seller',
      recipientId: sellerId,
      isRead: false,
      actionUrl: `/seller/orders`,
      metadata: { orderId, customerName }
    });
  }

  // Order status change notification
  createOrderStatusChangeNotification(sellerId: string, orderId: string, newStatus: string): LocalNotification {
    return this.createNotification({
      title: 'Order Status Updated',
      message: `Order #${orderId} status changed to ${newStatus}`,
      type: NotificationType.ORDER_STATUS_CHANGED,
      recipientType: 'seller',
      recipientId: sellerId,
      isRead: false,
      actionUrl: `/seller/orders`,
      metadata: { orderId, newStatus }
    });
  }

  // Order status change notification for admin
  createOrderStatusChangeForAdmin(sellerId: string, orderId: string, newStatus: string): LocalNotification {
    return this.createNotification({
      title: 'Order Status Updated',
      message: `Seller updated order #${orderId} to ${newStatus}`,
      type: NotificationType.ORDER_STATUS_CHANGED,
      recipientType: 'admin',
      senderId: sellerId,
      isRead: false,
      actionUrl: '/admin/orders',
      metadata: { orderId, newStatus, sellerId }
    });
  }

  // Payment received notification
  createPaymentReceivedNotification(sellerId: string, orderId: string, amount: number): LocalNotification {
    return this.createNotification({
      title: 'Payment Received',
      message: `Payment of $${amount.toFixed(2)} received for order #${orderId}`,
      type: NotificationType.PAYMENT_RECEIVED,
      recipientType: 'seller',
      recipientId: sellerId,
      isRead: false,
      actionUrl: `/seller/orders`,
      metadata: { orderId, amount }
    });
  }

  // New customer notification
  createNewCustomerNotification(customerName: string): LocalNotification {
    return this.createNotification({
      title: 'New Customer Registration',
      message: `New customer "${customerName}" has registered`,
      type: NotificationType.NEW_CUSTOMER,
      recipientType: 'admin',
      isRead: false,
      actionUrl: '/admin/customers',
      metadata: { customerName }
    });
  }

  // New supplier notification
  createNewSupplierNotification(supplierName: string): LocalNotification {
    return this.createNotification({
      title: 'New Supplier Registration',
      message: `New supplier "${supplierName}" has registered`,
      type: NotificationType.NEW_SUPPLIER,
      recipientType: 'admin',
      isRead: false,
      actionUrl: '/admin/suppliers',
      metadata: { supplierName }
    });
  }

  // Get notification icon based on type
  getNotificationIcon(type: NotificationType): string {
    switch (type) {
      case NotificationType.PRODUCT_APPROVED:
        return '✅';
      case NotificationType.PRODUCT_REJECTED:
        return '❌';
      case NotificationType.PRODUCT_PENDING:
      case NotificationType.PRODUCT_CREATED:
      case NotificationType.PRODUCT_UPDATED:
        return '⏳';
      case NotificationType.PRODUCT_DELETED:
        return '🗑️';
      case NotificationType.NEW_ORDER:
        return '🛒';
      case NotificationType.ORDER_STATUS_CHANGED:
      case NotificationType.ORDER_SHIPPED:
      case NotificationType.ORDER_DELIVERED:
        return '📦';
      case NotificationType.ORDER_CANCELLED:
        return '❌';
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
      case NotificationType.PAYMENT_RECEIVED:
        return 'bg-green-100 text-green-800 border-green-200';
      case NotificationType.PRODUCT_REJECTED:
      case NotificationType.ORDER_CANCELLED:
      case NotificationType.PRODUCT_DELETED:
        return 'bg-red-100 text-red-800 border-red-200';
      case NotificationType.PRODUCT_PENDING:
      case NotificationType.PRODUCT_CREATED:
      case NotificationType.PRODUCT_UPDATED:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case NotificationType.NEW_ORDER:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case NotificationType.ORDER_STATUS_CHANGED:
      case NotificationType.ORDER_SHIPPED:
      case NotificationType.ORDER_DELIVERED:
        return 'bg-purple-100 text-purple-800 border-purple-200';
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
  showSuccess(message: string, recipientType: 'admin' | 'seller' = 'admin'): void {
    const successNotification: LocalNotification = {
      id: `success-${Date.now()}`,
      title: 'Success',
      message: message,
      type: NotificationType.PRODUCT_APPROVED,
      recipientType,
      isRead: false,
      timestamp: new Date(),
      metadata: { isToast: true, isSuccess: true }
    };

    this.createNotification(successNotification);

    // Remove after 3 seconds
    setTimeout(() => {
      this.deleteNotification(successNotification.id);
    }, 3000);
  }

  showError(message: string, recipientType: 'admin' | 'seller' = 'admin'): void {
    const errorNotification: LocalNotification = {
      id: `error-${Date.now()}`,
      title: 'Error',
      message: message,
      type: NotificationType.PRODUCT_REJECTED,
      recipientType,
      isRead: false,
      timestamp: new Date(),
      metadata: { isToast: true, isError: true }
    };

    this.createNotification(errorNotification);

    // Remove after 5 seconds
    setTimeout(() => {
      this.deleteNotification(errorNotification.id);
    }, 5000);
  }

  showInfo(message: string, recipientType: 'admin' | 'seller' = 'admin'): void {
    const infoNotification: LocalNotification = {
      id: `info-${Date.now()}`,
      title: 'Information',
      message: message,
      type: NotificationType.PRODUCT_PENDING,
      recipientType,
      isRead: false,
      timestamp: new Date(),
      metadata: { isToast: true, isInfo: true }
    };

    this.createNotification(infoNotification);

    // Remove after 4 seconds
    setTimeout(() => {
      this.deleteNotification(infoNotification.id);
    }, 4000);
  }
}






