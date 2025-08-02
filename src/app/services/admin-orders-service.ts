import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { IOrder } from '../models/i-order';
import { OrderStatus, OrderStatusHistoryCreateDto } from '../models/i-order-status-history';
import { OrderStatusHistoryService } from './order-status-history.service';

@Injectable({
  providedIn: 'root'
})
export class AdminOrdersService {
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
  getAllOrders(): Observable<IOrder[]> {
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

  // Update order status
  updateOrderStatus(orderId: string, status: OrderStatus): Observable<any> {
    const statusHistory: OrderStatusHistoryCreateDto = {
      orderId: orderId,
      orderStatus: status
    };

    return this.orderStatusHistoryService.createOrderStatusHistory(statusHistory).pipe(
      catchError(error => {
        console.error(`Error updating status for order ${orderId}:`, error);
        return throwError(() => new Error('Failed to update order status'));
      })
    );
  }

  // Delete order
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
  }
}
