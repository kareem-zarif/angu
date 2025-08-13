import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UnifiedNotificationService } from '../../services/unified-notification.service';
import { AdminProductsService } from '../../services/admin-products-service';
import { AdminOrdersService } from '../../services/admin-orders-service';
import { SellerProductNotification } from '../seller-products/seller-products';
import { SellerOrderNotification } from '../../services/seller-orders.service';

@Component({
  selector: 'app-notification-test',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-6 max-w-4xl mx-auto">
      <h1 class="text-2xl font-bold mb-6">Notification System Test</h1>
      
      <!-- Test Buttons -->
      <div class="grid grid-cols-2 gap-4 mb-8">
        <div class="space-y-4">
          <h2 class="text-lg font-semibold">Admin Actions (Notify Sellers)</h2>
          <button 
            (click)="testAdminProductCreated()"
            class="w-full p-3 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Admin: Create Product
          </button>
          <button 
            (click)="testAdminProductApproved()"
            class="w-full p-3 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Admin: Approve Product
          </button>
          <button 
            (click)="testAdminProductRejected()"
            class="w-full p-3 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Admin: Reject Product
          </button>
          <button 
            (click)="testAdminOrderCreated()"
            class="w-full p-3 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            Admin: Create Order
          </button>
        </div>
        
        <div class="space-y-4">
          <h2 class="text-lg font-semibold">Seller Actions (Notify Admins)</h2>
          <button 
            (click)="testSellerProductCreated()"
            class="w-full p-3 bg-orange-500 text-white rounded hover:bg-orange-600"
          >
            Seller: Create Product
          </button>
          <button 
            (click)="testSellerProductUpdated()"
            class="w-full p-3 bg-yellow-500 text-white rounded hover:bg-yellow-600"
          >
            Seller: Update Product
          </button>
          <button 
            (click)="testSellerOrderStatusChanged()"
            class="w-full p-3 bg-indigo-500 text-white rounded hover:bg-indigo-600"
          >
            Seller: Change Order Status
          </button>
          <button 
            (click)="testSellerOrderShipped()"
            class="w-full p-3 bg-teal-500 text-white rounded hover:bg-teal-600"
          >
            Seller: Ship Order
          </button>
        </div>
      </div>

      <!-- Notification Stats -->
      <div class="bg-gray-100 p-4 rounded mb-6">
        <h3 class="text-lg font-semibold mb-2">Notification Statistics</h3>
        <div class="grid grid-cols-4 gap-4 text-sm">
          <div>
            <span class="font-medium">Total:</span> {{ stats.total }}
          </div>
          <div>
            <span class="font-medium">Unread:</span> {{ stats.unread }}
          </div>
          <div>
            <span class="font-medium">Admin → Seller:</span> {{ stats.byRecipientType['seller'] || 0 }}
          </div>
          <div>
            <span class="font-medium">Seller → Admin:</span> {{ stats.byRecipientType['admin'] || 0 }}
          </div>
        </div>
      </div>

      <!-- All Notifications -->
      <div class="bg-white border rounded-lg">
        <div class="p-4 border-b">
          <h3 class="text-lg font-semibold">All Notifications</h3>
          <button 
            (click)="markAllAsRead()"
            class="text-sm text-blue-600 hover:text-blue-800"
          >
            Mark all as read
          </button>
        </div>
        
        <div class="max-h-96 overflow-y-auto">
          <div 
            *ngFor="let notification of notifications" 
            class="p-4 border-b hover:bg-gray-50 cursor-pointer"
            [class.bg-blue-50]="!notification.isRead"
            (click)="markAsRead(notification.id)"
          >
            <div class="flex items-start gap-3">
              <span class="text-lg">{{ getNotificationIcon(notification.type) }}</span>
              <div class="flex-1">
                <div class="font-medium">{{ notification.title }}</div>
                <div class="text-sm text-gray-600">{{ notification.message }}</div>
                <div class="text-xs text-gray-500 mt-1">
                  {{ notification.timestamp | date:'short' }} | 
                  {{ notification.recipientType }} | 
                  {{ notification.source }}
                </div>
              </div>
              <div *ngIf="!notification.isRead" class="w-2 h-2 bg-blue-500 rounded-full"></div>
            </div>
          </div>
          
          <div *ngIf="notifications.length === 0" class="p-8 text-center text-gray-500">
            No notifications yet. Try clicking the test buttons above!
          </div>
        </div>
      </div>
    </div>
  `
})
export class NotificationTestComponent implements OnInit {
  notifications: any[] = [];
  stats = {
    total: 0,
    unread: 0,
    byRecipientType: {} as any
  };

  constructor(
    private unifiedNotificationService: UnifiedNotificationService,
    private adminProductsService: AdminProductsService,
    private adminOrdersService: AdminOrdersService
  ) {}

  ngOnInit() {
    // Subscribe to all notifications
    this.unifiedNotificationService.getAllNotifications().subscribe(notifications => {
      this.notifications = notifications;
    });

    // Subscribe to notification stats
    this.unifiedNotificationService.getNotificationStats().subscribe(stats => {
      this.stats = stats;
    });
  }

  // Admin test methods - simulate admin actions
  testAdminProductCreated() {
    const notification = {
      id: `admin-product-${Date.now()}`,
      title: 'New Product Created',
      message: 'Admin has created a new product: Test Product',
      type: 'product_created',
      recipientType: 'seller',
      recipientId: 'seller-123',
      isRead: false,
      timestamp: new Date(),
      actionUrl: '/seller/products',
      metadata: { productName: 'Test Product' }
    };
    this.unifiedNotificationService.addAdminNotification(notification);
  }

  testAdminProductApproved() {
    const notification = {
      id: `admin-product-${Date.now()}`,
      title: 'Product Approved',
      message: 'Your product "Test Product" has been approved and is now live.',
      type: 'product_approved',
      recipientType: 'seller',
      recipientId: 'seller-123',
      isRead: false,
      timestamp: new Date(),
      actionUrl: '/seller/products',
      metadata: { productName: 'Test Product' }
    };
    this.unifiedNotificationService.addAdminNotification(notification);
  }

  testAdminProductRejected() {
    const notification = {
      id: `admin-product-${Date.now()}`,
      title: 'Product Rejected',
      message: 'Your product "Test Product" has been rejected. Please review and update.',
      type: 'product_rejected',
      recipientType: 'seller',
      recipientId: 'seller-123',
      isRead: false,
      timestamp: new Date(),
      actionUrl: '/seller/products',
      metadata: { productName: 'Test Product' }
    };
    this.unifiedNotificationService.addAdminNotification(notification);
  }

  testAdminOrderCreated() {
    const notification = {
      id: `admin-order-${Date.now()}`,
      title: 'New Order Created',
      message: 'Admin has created a new order: #12345',
      type: 'order_created',
      recipientType: 'seller',
      recipientId: 'seller-123',
      isRead: false,
      timestamp: new Date(),
      actionUrl: '/seller/orders',
      metadata: { orderId: '12345' }
    };
    this.unifiedNotificationService.addAdminNotification(notification);
  }

  // Seller test methods
  testSellerProductCreated() {
    const notification: SellerProductNotification = {
      id: `test-${Date.now()}`,
      title: 'New Product Pending Review',
      message: 'New product "Seller Test Product" has been submitted for approval.',
      type: 'product_created',
      recipientType: 'admin',
      isRead: false,
      timestamp: new Date(),
      actionUrl: '/admin/products',
      metadata: { productName: 'Seller Test Product', sellerId: 'seller-123' }
    };
    this.unifiedNotificationService.addSellerNotification(notification);
  }

  testSellerProductUpdated() {
    const notification: SellerProductNotification = {
      id: `test-${Date.now()}`,
      title: 'Product Updated',
      message: 'Product "Seller Test Product" has been updated by seller.',
      type: 'product_updated',
      recipientType: 'admin',
      isRead: false,
      timestamp: new Date(),
      actionUrl: '/admin/products',
      metadata: { productName: 'Seller Test Product', sellerId: 'seller-123' }
    };
    this.unifiedNotificationService.addSellerNotification(notification);
  }

  testSellerOrderStatusChanged() {
    const notification: SellerOrderNotification = {
      id: `test-${Date.now()}`,
      title: 'Order Status Changed',
      message: 'Order #12345 status has been changed to "Processing" by seller.',
      type: 'order_status_changed',
      recipientType: 'admin',
      isRead: false,
      timestamp: new Date(),
      actionUrl: '/admin/orders',
      metadata: { orderId: '12345', status: 'Processing', sellerId: 'seller-123' }
    };
    this.unifiedNotificationService.addSellerNotification(notification);
  }

  testSellerOrderShipped() {
    const notification: SellerOrderNotification = {
      id: `test-${Date.now()}`,
      title: 'Order Shipped',
      message: 'Order #12345 has been marked as shipped by seller.',
      type: 'order_shipped',
      recipientType: 'admin',
      isRead: false,
      timestamp: new Date(),
      actionUrl: '/admin/orders',
      metadata: { orderId: '12345', trackingNumber: 'TRK123456', sellerId: 'seller-123' }
    };
    this.unifiedNotificationService.addSellerNotification(notification);
  }

  markAsRead(notificationId: string) {
    this.unifiedNotificationService.markAsRead(notificationId);
  }

  markAllAsRead() {
    this.unifiedNotificationService.markAllAsRead();
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'product_created':
      case 'product_updated':
      case 'product_approved':
      case 'product_rejected':
      case 'product_deleted':
        return '🛍️';
      case 'order_created':
      case 'order_updated':
      case 'order_deleted':
      case 'order_status_changed':
      case 'order_shipped':
      case 'order_delivered':
      case 'order_cancelled':
        return '📦';
      case 'supplier_created':
      case 'supplier_updated':
      case 'supplier_deleted':
        return '🏭';
      default:
        return '📢';
    }
  }
}
