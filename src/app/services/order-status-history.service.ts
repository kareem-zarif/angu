import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of, catchError, throwError } from 'rxjs';
import {
  IOrderStatusHistory,
  OrderStatus,
  OrderStatusHistoryCreateDto,
  OrderStatusHistoryResDto,
  OrderStatusHistoryUpdateDto
} from '../models/i-order-status-history';

@Injectable({ providedIn: 'root' })
export class OrderStatusHistoryService {
  private apiUrl = 'https://localhost:7777/api/OrderStatusHistory';

  // Cache for status histories
  private statusHistoryCache: IOrderStatusHistory[] = [];
  private lastFetchTime: number = 0;
  private cacheDuration: number = 5 * 60 * 1000; // 5 minutes cache

  constructor(private http: HttpClient) { }

  // Create a new order status history
  createOrderStatusHistory(statusHistory: OrderStatusHistoryCreateDto): Observable<OrderStatusHistoryResDto> {
    return this.http.post<OrderStatusHistoryResDto>(this.apiUrl, statusHistory);
  }

  // Get all order status histories
  getAllOrderStatusHistory(): Observable<OrderStatusHistoryResDto[]> {
    // Check if we have a valid cache
    const now = Date.now();
    if (this.statusHistoryCache.length > 0 && (now - this.lastFetchTime) < this.cacheDuration) {
      return of(this.statusHistoryCache as OrderStatusHistoryResDto[]);
    }

    return this.http.get<OrderStatusHistoryResDto[]>(this.apiUrl).pipe(
      map(histories => {
        this.statusHistoryCache = histories;
        this.lastFetchTime = now;
        return histories;
      }),
      catchError(error => {
        console.error('Error fetching order status histories:', error);
        return throwError(() => new Error('Failed to fetch order status histories'));
      })
    );
  }

  // Get order status history by ID
  getOrderStatusHistoryById(id: string): Observable<OrderStatusHistoryResDto> {
    // Check cache first
    const cachedHistory = this.statusHistoryCache.find(h => h.id === id);
    if (cachedHistory) {
      return of(cachedHistory as OrderStatusHistoryResDto);
    }

    return this.http.get<OrderStatusHistoryResDto>(`${this.apiUrl}/${id}`);
  }

  // Update an order status history
  updateOrderStatusHistory(statusHistory: OrderStatusHistoryUpdateDto): Observable<OrderStatusHistoryResDto> {
    return this.http.put<OrderStatusHistoryResDto>(this.apiUrl, statusHistory).pipe(
      map(updatedHistory => {
        // Update cache
        const index = this.statusHistoryCache.findIndex(h => h.id === updatedHistory.id);
        if (index !== -1) {
          this.statusHistoryCache[index] = updatedHistory;
        }
        return updatedHistory;
      })
    );
  }

  // Delete an order status history
  deleteOrderStatusHistory(id: string): Observable<OrderStatusHistoryResDto> {
    return this.http.delete<OrderStatusHistoryResDto>(`${this.apiUrl}/${id}`).pipe(
      map(deletedHistory => {
        // Update cache
        this.statusHistoryCache = this.statusHistoryCache.filter(h => h.id !== id);
        return deletedHistory;
      })
    );
  }

  // Get order status history by order ID
  getOrderStatusHistoryByOrderId(orderId: string): Observable<OrderStatusHistoryResDto[]> {
    console.log(`Fetching all status history from: ${this.apiUrl}`);

    // Check if we have a valid cache with entries for this order
    const cachedHistories = this.statusHistoryCache.filter(h => h.orderId === orderId);
    if (cachedHistories.length > 0 && (Date.now() - this.lastFetchTime) < this.cacheDuration) {
      return of(cachedHistories as OrderStatusHistoryResDto[]);
    }

    // If not in cache or cache is invalid, fetch from API
    return this.getAllOrderStatusHistory().pipe(
      map(allHistory => {
        console.log(`All status history received:`, allHistory);
        const filteredHistory = allHistory.filter(history => history.orderId === orderId);
        console.log(`Filtered history for order ${orderId}:`, filteredHistory);
        return filteredHistory;
      })
    );
  }

  // Get the latest status for an order
  getLatestStatusForOrder(orderId: string): Observable<OrderStatus | null> {
    return this.getOrderStatusHistoryByOrderId(orderId).pipe(
      map(histories => {
        if (!histories || histories.length === 0) {
          return null;
        }

        // Sort by modified date descending and return the status of the first (most recent)
        const sortedHistories = [...histories].sort((a, b) =>
          new Date(b.modifiedOn).getTime() - new Date(a.modifiedOn).getTime()
        );

        return sortedHistories[0].orderStatus;
      })
    );
  }

  // Clear cache
  clearCache(): void {
    this.statusHistoryCache = [];
    this.lastFetchTime = 0;
  }
}
