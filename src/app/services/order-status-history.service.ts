import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { IOrderStatusHistory, OrderStatus } from '../models/i-order-status-history';
import { environment } from '../../environment/environment';

// Keep existing interfaces
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

export interface OrderStatusHistoryResDto {
  id: string;
  orderStatus: OrderStatus; // Make sure this matches the enum
  modifiedOn: Date;
  orderId: string;
}

export interface OrderStatusHistoryUpdateDto {
  id: string;
  orderStatus: OrderStatus;
  orderId: string;
}

@Injectable({ providedIn: 'root' })
export class OrderStatusHistoryService {
  private apiUrl = `${environment.apiUrl}/OrderStatusHistory`;

  // Cache management
  private statusHistoryCache: IOrderStatusHistory[] = [];
  private lastFetchTime: number = 0;
  private cacheDuration: number = 5 * 60 * 1000; // 5 minutes cache

  constructor(private http: HttpClient) { }

  // Combine both service implementations
  createOrderStatusHistory(statusHistory: OrderStatusHistoryCreateDto): Observable<OrderStatusHistoryResDto> {
    return this.http.post<OrderStatusHistoryResDto>(this.apiUrl, statusHistory).pipe(
      tap(newHistory => {
        this.statusHistoryCache.push(newHistory as IOrderStatusHistory);
      }),
      catchError(error => {
        console.error('Error creating order status history:', error);
        return throwError(() => new Error('Failed to create order status history'));
      })
    );
  }

  getAllOrderStatusHistory(): Observable<OrderStatusHistoryResDto[]> {
    // Use cache if available
    const now = Date.now();
    if (this.statusHistoryCache.length > 0 && (now - this.lastFetchTime) < this.cacheDuration) {
      return of(this.statusHistoryCache as OrderStatusHistoryResDto[]);
    }

    return this.http.get<OrderStatusHistoryResDto[]>(this.apiUrl).pipe(
      tap(histories => {
        this.statusHistoryCache = histories as IOrderStatusHistory[];
        this.lastFetchTime = Date.now();
      })
    );
  }

  // Keep your existing methods with caching
  getOrderStatusHistoryById(orderId: string): Observable<IOrderStatusHistory[]> {
    const cachedHistory = this.statusHistoryCache.filter(h => h.id === orderId);
    if (cachedHistory.length > 0) {
      return of(cachedHistory);
    }

    return this.http.get<OrderStatusHistoryResDto[]>(`${this.apiUrl}/${orderId}`).pipe(
      map(histories => histories.map(h => ({
        id: h.id,
        orderStatus: h.orderStatus,
        modifiedOn: h.modifiedOn,
        orderId: h.orderId
      } as IOrderStatusHistory)))
    );
  }

  // Combine update methods
  updateOrderStatusHistory(statusHistory: OrderStatusHistoryUpdateDto): Observable<OrderStatusHistoryResDto> {
    return this.http.put<OrderStatusHistoryResDto>(this.apiUrl, statusHistory).pipe(
      tap(updatedHistory => {
        const index = this.statusHistoryCache.findIndex(h => h.id === updatedHistory.id);
        if (index !== -1) {
          this.statusHistoryCache[index] = updatedHistory as IOrderStatusHistory;
        }
      })
    );
  }

  // Keep delete with cache update
  deleteOrderStatusHistory(id: string): Observable<OrderStatusHistoryResDto> {
    return this.http.delete<OrderStatusHistoryResDto>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        this.statusHistoryCache = this.statusHistoryCache.filter(h => h.id !== id);
      })
    );
  }

  // Keep existing getByOrderId with caching
  getOrderStatusHistoryByOrderId(orderId: string): Observable<OrderStatusHistoryResDto[]> {
    const cachedHistories = this.statusHistoryCache.filter(h => h.orderId === orderId);
    if (cachedHistories.length > 0) {
      return of(cachedHistories as OrderStatusHistoryResDto[]);
    }

    return this.http.get<OrderStatusHistoryResDto[]>(this.apiUrl).pipe(
      map(allHistory => {
        const filteredHistory = allHistory.filter(history => history.orderId === orderId);
        // Update cache
        this.updateCache(filteredHistory as IOrderStatusHistory[]);
        return filteredHistory;
      })
    );
  }

  // Keep utility methods
  getLatestStatusForOrder(orderId: string): Observable<IOrderStatusHistory | null> {
    return this.getOrderStatusHistoryByOrderId(orderId).pipe(
      map(histories => {
        if (histories.length === 0) return null;
        return histories.sort((a, b) =>
          new Date(b.modifiedOn).getTime() - new Date(a.modifiedOn).getTime()
        )[0] as IOrderStatusHistory;
      })
    );
  }

  // Cache management methods
  clearCache(): void {
    this.statusHistoryCache = [];
    this.lastFetchTime = 0;
  }

  private updateCache(histories: IOrderStatusHistory[]): void {
    const existingIds = this.statusHistoryCache.map(h => h.id);
    const newHistories = histories.filter(h => !existingIds.includes(h.id));
    this.statusHistoryCache = [...this.statusHistoryCache, ...newHistories];
    this.lastFetchTime = Date.now();
  }
}
