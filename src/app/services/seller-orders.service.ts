import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map, of } from 'rxjs';
import { OrdersService, OrderResDto } from './orders-service';
import { OrderStatusHistoryService, OrderStatusHistoryResDto, OrderStatus } from './order-status-history.service';
import { IOrder } from '../models/i-order';
import { environment } from '../../environment/environment';

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
  private apiUrl = `${environment.apiUrl}/Order`;

  constructor(
    private http: HttpClient,
    private ordersService: OrdersService,
    private orderStatusHistoryService: OrderStatusHistoryService
  ) {}

  // Get all seller orders with status history
  getSellerOrders(filter?: SellerOrderFilter): Observable<IOrder[]> {
    return this.ordersService.getOrders().pipe(
      map(orders => {
        // Convert OrderResDto to IOrder format
        return orders.map(order => ({
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
          orderStatusHistory: [] // Will be populated separately
        } as IOrder));
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

  // Get seller order statistics
  getSellerOrderStats(): Observable<SellerOrderStats> {
    return this.ordersService.getOrders().pipe(
      map(orders => {
        const totalOrders = orders.length;
        const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
        const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        // For now, we'll use mock data for status counts since we need to fetch status history
        // In a real implementation, you'd need to fetch status history for all orders
        return {
          totalOrders,
          pendingOrders: Math.floor(totalOrders * 0.3), // Mock data
          processingOrders: Math.floor(totalOrders * 0.2), // Mock data
          shippedOrders: Math.floor(totalOrders * 0.25), // Mock data
          deliveredOrders: Math.floor(totalOrders * 0.2), // Mock data
          cancelledOrders: Math.floor(totalOrders * 0.05), // Mock data
          totalRevenue,
          averageOrderValue
        };
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
    });
  }

  // Mark order as delivered
  markOrderAsDelivered(orderId: string): Observable<any> {
    return this.updateOrderStatus({
      orderId,
      status: 'Delivered'
    });
  }

  // Cancel order
  cancelOrder(orderId: string, reason: string): Observable<any> {
    return this.updateOrderStatus({
      orderId,
      status: 'Cancelled',
      notes: reason
    });
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
} 