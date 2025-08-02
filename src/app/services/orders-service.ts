import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError, forkJoin } from 'rxjs';
import { catchError, map, tap, switchMap } from 'rxjs/operators';
import { IOrder } from '../models/i-order';
import { OrderStatus, IOrderStatusHistory } from '../models/i-order-status-history';
import { OrderStatusHistoryService } from './order-status-history.service';

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private _baseUrl = 'https://localhost:7777/api/Order';

  // Cache management
  private ordersCache: IOrder[] = [];
  private lastFetchTime: number = 0;
  private cacheDuration: number = 5 * 60 * 1000; // 5 minutes cache

  constructor(
    private http: HttpClient,
    private orderStatusHistoryService: OrderStatusHistoryService
  ) { }

  // Get all orders
  getOrders(): Observable<IOrder[]> {
    // Check if we have a valid cache
    const now = Date.now();
    if (this.ordersCache.length > 0 && (now - this.lastFetchTime) < this.cacheDuration) {
      return of(this.ordersCache);
    }

    return this.http.get<IOrder[]>(`${this._baseUrl}`).pipe(
      tap(orders => {
        this.ordersCache = orders;
        this.lastFetchTime = Date.now();
      }),
      catchError(error => {
        console.error('Error fetching orders:', error);
        return throwError(() => new Error('Failed to fetch orders'));
      })
    );
  }

  // Get order by ID
  getOrderById(id: string): Observable<IOrder> {
    // Check cache first
    const cachedOrder = this.ordersCache.find(o => o.id === id);
    if (cachedOrder) {
      return of(cachedOrder);
    }

    return this.http.get<IOrder>(`${this._baseUrl}/${id}`).pipe(
      catchError(error => {
        console.error(`Error fetching order with ID ${id}:`, error);
        return throwError(() => new Error(`Order with ID ${id} not found`));
      })
    );
  }

  // Get orders by customer ID
  getOrdersByCustomerId(customerId: string): Observable<IOrder[]> {
    return this.http.get<IOrder[]>(`${this._baseUrl}/customer/${customerId}`).pipe(
      catchError(error => {
        console.error(`Error fetching orders for customer ${customerId}:`, error);
        return throwError(() => new Error('Failed to fetch orders for customer'));
      })
    );
  }

  // Get orders by year
  getOrdersByYear(year: number): Observable<IOrder[]> {
    return this.getOrders().pipe(
      map(orders => orders.filter(order => {
        if (order.createdOn) {
          const orderDate = new Date(order.createdOn);
          return orderDate.getFullYear() === year;
        }
        return false;
      }))
    );
  }

  // Get orders by status
  getOrdersByStatus(status: OrderStatus): Observable<IOrder[]> {
    return this.getOrders().pipe(
      switchMap(orders => {
        // For each order, get the latest status history
        const orderWithStatusObservables = orders.map(order => {
          if (!order.orderStatusHistory || order.orderStatusHistory.length === 0) {
            // If no status history is available in the order, fetch it
            return this.orderStatusHistoryService.getLatestStatusForOrder(order.id).pipe(
              map(latestStatus => {
                return {
                  order,
                  latestStatus
                };
              })
            );
          } else {
            // If status history is available, find the latest one
            const latestStatus = order.orderStatusHistory.sort((a, b) =>
              new Date(b.modifiedOn).getTime() - new Date(a.modifiedOn).getTime()
            )[0];
            return of({ order, latestStatus });
          }
        });

        // Combine all observables
        return forkJoin(orderWithStatusObservables);
      }),
      map(orderStatusPairs => {
        // Filter orders by the requested status
        return orderStatusPairs
          .filter(pair => pair.latestStatus && pair.latestStatus.orderStatus === status)
          .map(pair => pair.order);
      })
    );
  }

  // Get latest status for an order
  getLatestStatusForOrder(orderId: string): Observable<OrderStatus | null> {
    return this.orderStatusHistoryService.getLatestStatusForOrder(orderId).pipe(
      map(statusHistory => statusHistory ? statusHistory.orderStatus : null)
    );
  }

  // Search orders
  searchOrders(query: string): Observable<IOrder[]> {
    return this.getOrders().pipe(
      map(orders => {
        const q = query.toLowerCase();
        return orders.filter(order =>
          order.id.toLowerCase().includes(q) ||
          (order.customerName && order.customerName.toLowerCase().includes(q)) ||
          order.orderItems.some(item => item.productName.toLowerCase().includes(q))
        );
      })
    );
  }

  // Create a new order
  createOrder(order: IOrder): Observable<IOrder> {
    return this.http.post<IOrder>(`${this._baseUrl}`, order).pipe(
      tap(newOrder => {
        // Update cache
        this.ordersCache.push(newOrder);
      }),
      catchError(error => {
        console.error('Error creating order:', error);
        return throwError(() => new Error('Failed to create order'));
      })
    );
  }

  // Update an existing order
  updateOrder(order: IOrder): Observable<IOrder> {
    return this.http.put<IOrder>(`${this._baseUrl}/${order.id}`, order).pipe(
      tap(updatedOrder => {
        // Update cache
        const index = this.ordersCache.findIndex(o => o.id === updatedOrder.id);
        if (index !== -1) {
          this.ordersCache[index] = updatedOrder;
        }
      }),
      catchError(error => {
        console.error(`Error updating order with ID ${order.id}:`, error);
        return throwError(() => new Error('Failed to update order'));
      })
    );
  }

  // Delete an order
  deleteOrder(id: string): Observable<void> {
    return this.http.delete<void>(`${this._baseUrl}/${id}`).pipe(
      tap(() => {
        // Update cache
        this.ordersCache = this.ordersCache.filter(o => o.id !== id);
      }),
      catchError(error => {
        console.error(`Error deleting order with ID ${id}:`, error);
        return throwError(() => new Error('Failed to delete order'));
      })
    );
  }

  // Clear cache
  clearCache(): void {
    this.ordersCache = [];
    this.lastFetchTime = 0;
    this.orderStatusHistoryService.clearCache();
  }
}
