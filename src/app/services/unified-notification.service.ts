import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { LocalStorageNotificationService, LocalNotification } from './local-storage-notification.service';

export interface UnifiedNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  recipientType: 'admin' | 'seller' | 'supplier';
  recipientId?: string;
  isRead: boolean;
  timestamp: Date;
  actionUrl?: string;
  metadata?: any;
  source: 'admin-products' | 'admin-orders' | 'admin-suppliers' | 'seller-products' | 'seller-orders';
}

@Injectable({
  providedIn: 'root'
})
export class UnifiedNotificationService {
  private allNotificationsSubject = new BehaviorSubject<UnifiedNotification[]>([]);
  public allNotifications$ = this.allNotificationsSubject.asObservable();

  constructor(
    private localNotificationService: LocalStorageNotificationService
  ) {
    this.initializeNotificationStreams();
  }

  private initializeNotificationStreams(): void {
    // Use local storage notification service for all notifications
    // No longer using combineLatest since we're using local storage service
    // Subscribe to admin notifications
    this.localNotificationService.adminNotifications$.subscribe(adminNotifications => {
      const unifiedNotifications: UnifiedNotification[] = adminNotifications.map(notif => ({
        ...notif,
        source: 'admin-products' as const, // Default source, can be enhanced later
        type: notif.type
      }));
      
      this.allNotificationsSubject.next(unifiedNotifications);
    });
    
    // Subscribe to seller notifications
    this.localNotificationService.sellerNotifications$.subscribe(sellerNotifications => {
      const unifiedNotifications: UnifiedNotification[] = sellerNotifications.map(notif => ({
        ...notif,
        source: 'seller-products' as const, // Default source, can be enhanced later
        type: notif.type
      }));
      
      const currentNotifications = this.allNotificationsSubject.value;
      this.allNotificationsSubject.next([...currentNotifications, ...unifiedNotifications]);
    });
  }

  // Get all notifications
  getAllNotifications(): Observable<UnifiedNotification[]> {
    return this.allNotifications$;
  }

  // Get notifications by recipient type
  getNotificationsByRecipientType(recipientType: 'admin' | 'seller' | 'supplier'): Observable<UnifiedNotification[]> {
    return this.allNotifications$.pipe(
      map(notifications => notifications.filter(n => n.recipientType === recipientType))
    );
  }

  // Get notifications by recipient ID
  getNotificationsByRecipientId(recipientId: string): Observable<UnifiedNotification[]> {
    return this.allNotifications$.pipe(
      map(notifications => notifications.filter(n => n.recipientId === recipientId))
    );
  }

  // Get unread notifications count
  getUnreadCount(recipientType?: 'admin' | 'seller' | 'supplier', recipientId?: string): Observable<number> {
    return this.allNotifications$.pipe(
      map(notifications => {
        let filtered = notifications.filter(n => !n.isRead);
        
        if (recipientType) {
          filtered = filtered.filter(n => n.recipientType === recipientType);
        }
        
        if (recipientId) {
          filtered = filtered.filter(n => n.recipientId === recipientId);
        }
        
        return filtered.length;
      })
    );
  }

  // Mark notification as read
  markAsRead(notificationId: string): void {
    const currentNotifications = this.allNotificationsSubject.value;
    const updatedNotifications = currentNotifications.map(notification => 
      notification.id === notificationId 
        ? { ...notification, isRead: true }
        : notification
    );
    this.allNotificationsSubject.next(updatedNotifications);

    // Mark as read in the local storage service
    this.localNotificationService.markAsRead(notificationId);
  }

  // Mark all notifications as read
  markAllAsRead(recipientType?: 'admin' | 'seller' | 'supplier', recipientId?: string): void {
    const currentNotifications = this.allNotificationsSubject.value;
    const updatedNotifications = currentNotifications.map(notification => {
      let shouldMark = true;
      
      if (recipientType && notification.recipientType !== recipientType) {
        shouldMark = false;
      }
      
      if (recipientId && notification.recipientId !== recipientId) {
        shouldMark = false;
      }
      
      return shouldMark ? { ...notification, isRead: true } : notification;
    });
    
    this.allNotificationsSubject.next(updatedNotifications);

    // Mark all as read in local storage service - only for admin and seller types
    if (recipientType && (recipientType === 'admin' || recipientType === 'seller')) {
      this.localNotificationService.markAllAsRead(recipientType, recipientId);
    }
  }

  // Clear notifications
  clearNotifications(recipientType?: 'admin' | 'seller' | 'supplier', recipientId?: string): void {
    if (recipientType && (recipientType === 'admin' || recipientType === 'seller')) {
      this.localNotificationService.clearNotifications(recipientType, recipientId);
    } else if (recipientType === 'supplier') {
      // Handle supplier notifications separately if needed
      console.log('Supplier notifications not yet implemented in local storage service');
    } else {
      // Clear all
      this.allNotificationsSubject.next([]);
    }
  }

  // Get notifications by type
  getNotificationsByType(type: string): Observable<UnifiedNotification[]> {
    return this.allNotifications$.pipe(
      map(notifications => notifications.filter(n => n.type === type))
    );
  }

  // Get recent notifications (last 24 hours)
  getRecentNotifications(hours: number = 24): Observable<UnifiedNotification[]> {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    return this.allNotifications$.pipe(
      map(notifications => 
        notifications.filter(n => n.timestamp > cutoffTime)
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      )
    );
  }

  // Get notification statistics
  getNotificationStats(): Observable<{
    total: number;
    unread: number;
    byType: { [key: string]: number };
    byRecipientType: { [key: string]: number };
  }> {
    return this.allNotifications$.pipe(
      map(notifications => {
        const total = notifications.length;
        const unread = notifications.filter(n => !n.isRead).length;
        
        const byType: { [key: string]: number } = {};
        const byRecipientType: { [key: string]: number } = {};
        
        notifications.forEach(notification => {
          byType[notification.type] = (byType[notification.type] || 0) + 1;
          byRecipientType[notification.recipientType] = (byRecipientType[notification.recipientType] || 0) + 1;
        });
        
        return { total, unread, byType, byRecipientType };
      })
    );
  }

  // No longer needed - using LocalStorageNotificationService instead
  // private markAsReadInSourceService(notificationId: string): void {
  //   // Try to mark as read in each source service
  //   try {
  //     this.adminProductsService.markNotificationAsRead(notificationId);
  //   } catch (e) {
  //     // Notification not found in this service
  //   }
  //   
  //   try {
  //     this.adminOrdersService.markNotificationAsRead(notificationId);
  //   } catch (e) {
  //     // Notification not found in this service
  //   }
  //   
  //   try {
  //     this.adminSuppliersService.markNotificationAsRead(notificationId);
  //   } catch (e) {
  //     // Notification not found in this service
  //   }
  // }

  // Method to add seller notifications (called from seller components)
  addSellerNotification(notification: any): void {
    // Create notification using local storage service instead
    this.localNotificationService.createNotification({
      title: notification.title,
      message: notification.message,
      type: notification.type as any,
      recipientType: notification.recipientType,
      recipientId: notification.recipientId,
      isRead: false,
      actionUrl: notification.actionUrl,
      metadata: notification.metadata
    });
  }

  // Method to add admin notifications (called from test component)
  addAdminNotification(notification: any): void {
    // Create notification using local storage service instead
    this.localNotificationService.createNotification({
      title: notification.title,
      message: notification.message,
      type: notification.type as any,
      recipientType: notification.recipientType,
      recipientId: notification.recipientId,
      isRead: false,
      actionUrl: notification.actionUrl,
      metadata: notification.metadata
    });
  }
}
