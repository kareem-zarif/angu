import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { IOrderStatusHistory, OrderStatus } from '../models/i-order-status-history';

@Injectable({
  providedIn: 'root'
})
export class OrderStatusHistoryService {
  private _baseUrl = 'https://localhost:7777/api/OrderStatusHistory';

  // Cache management
  private statusHistoryCache: IOrderStatusHistory[] = [];
  private lastFetchTime: number = 0;
  private cacheDuration: number = 5 * 60 * 1000; // 5 minutes cache

  constructor(private http: HttpClient) { }

  // Get all order status histories
  getAll(): Observable<IOrderStatusHistory[]> {
    // Check if we have a valid cache
    const now = Date.now();
    if (this.statusHistoryCache.length > 0 && (now - this.lastFetchTime) < this.cacheDuration) {
      return of(this.statusHistoryCache);
    }

    return this.http.get<IOrderStatusHistory[]>(`${this._baseUrl}`).pipe(
      tap(histories => {
        this.statusHistoryCache = histories;
        this.lastFetchTime = Date.now();
      }),
      catchError(error => {
        console.error('Error fetching order status histories:', error);
        return throwError(() => new Error('Failed to fetch order status histories'));
      })
    );
  }

  // Get order status history by ID
  getById(id: string): Observable<IOrderStatusHistory> {
    // Check cache first
    const cachedHistory = this.statusHistoryCache.find(h => h.id === id);
    if (cachedHistory) {
      return of(cachedHistory);
    }

    return this.http.get<IOrderStatusHistory>(`${this._baseUrl}/${id}`).pipe(
      catchError(error => {
        console.error(`Error fetching order status history with ID ${id}:`, error);
        return throwError(() => new Error(`Order status history with ID ${id} not found`));
      })
    );
  }

  // Get order status histories by order ID
  getByOrderId(orderId: string): Observable<IOrderStatusHistory[]> {
    // Check cache first
    const cachedHistories = this.statusHistoryCache.filter(h => h.orderId === orderId);
    if (cachedHistories.length > 0) {
      return of(cachedHistories);
    }

    return this.http.get<IOrderStatusHistory[]>(`${this._baseUrl}/order/${orderId}`).pipe(
      tap(histories => {
        // Update cache with new histories
        const existingIds = this.statusHistoryCache.map(h => h.id);
        const newHistories = histories.filter(h => !existingIds.includes(h.id));
        this.statusHistoryCache = [...this.statusHistoryCache, ...newHistories];
      }),
      catchError(error => {
        console.error(`Error fetching order status histories for order ${orderId}:`, error);
        return throwError(() => new Error('Failed to fetch order status histories for order'));
      })
    );
  }

  // Get latest status for an order
  getLatestStatusForOrder(orderId: string): Observable<IOrderStatusHistory | null> {
    return this.getByOrderId(orderId).pipe(
      map(histories => {
        if (histories.length === 0) return null;

        // Sort by modified date descending and return the first (most recent)
        return histories.sort((a, b) =>
          new Date(b.modifiedOn).getTime() - new Date(a.modifiedOn).getTime()
        )[0];
      })
    );
  }

  // Create a new order status history
  create(orderStatusHistory: IOrderStatusHistory): Observable<IOrderStatusHistory> {
    return this.http.post<IOrderStatusHistory>(`${this._baseUrl}`, orderStatusHistory).pipe(
      tap(newHistory => {
        // Update cache
        this.statusHistoryCache.push(newHistory);
      }),
      catchError(error => {
        console.error('Error creating order status history:', error);
        return throwError(() => new Error('Failed to create order status history'));
      })
    );
  }

  // Update an existing order status history
  update(orderStatusHistory: IOrderStatusHistory): Observable<IOrderStatusHistory> {
    return this.http.put<IOrderStatusHistory>(`${this._baseUrl}/${orderStatusHistory.id}`, orderStatusHistory).pipe(
      tap(updatedHistory => {
        // Update cache
        const index = this.statusHistoryCache.findIndex(h => h.id === updatedHistory.id);
        if (index !== -1) {
          this.statusHistoryCache[index] = updatedHistory;
        }
      }),
      catchError(error => {
        console.error(`Error updating order status history with ID ${orderStatusHistory.id}:`, error);
        return throwError(() => new Error('Failed to update order status history'));
      })
    );
  }

  // Delete an order status history
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this._baseUrl}/${id}`).pipe(
      tap(() => {
        // Update cache
        this.statusHistoryCache = this.statusHistoryCache.filter(h => h.id !== id);
      }),
      catchError(error => {
        console.error(`Error deleting order status history with ID ${id}:`, error);
        return throwError(() => new Error('Failed to delete order status history'));
      })
    );
  }

  // Clear cache
  clearCache(): void {
    this.statusHistoryCache = [];
    this.lastFetchTime = 0;
  }
}
