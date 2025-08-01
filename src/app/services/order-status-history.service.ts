import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { OrderStatus } from './admin-orders-service';

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
  orderStatus: OrderStatus;
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
  private apiUrl = 'https://localhost:7253/api/OrderStatusHistory';

  constructor(private http: HttpClient) {}

  createOrderStatusHistory(statusHistory: OrderStatusHistoryCreateDto): Observable<OrderStatusHistoryResDto> {
    return this.http.post<OrderStatusHistoryResDto>(this.apiUrl, statusHistory);
  }

  getAllOrderStatusHistory(): Observable<OrderStatusHistoryResDto[]> {
    return this.http.get<OrderStatusHistoryResDto[]>(this.apiUrl);
  }

  getOrderStatusHistoryById(id: string): Observable<OrderStatusHistoryResDto> {
    return this.http.get<OrderStatusHistoryResDto>(`${this.apiUrl}/${id}`);
  }

  updateOrderStatusHistory(statusHistory: OrderStatusHistoryUpdateDto): Observable<OrderStatusHistoryResDto> {
    return this.http.put<OrderStatusHistoryResDto>(this.apiUrl, statusHistory);
  }

  deleteOrderStatusHistory(id: string): Observable<OrderStatusHistoryResDto> {
    return this.http.delete<OrderStatusHistoryResDto>(`${this.apiUrl}/${id}`);
  }

  getOrderStatusHistoryByOrderId(orderId: string): Observable<OrderStatusHistoryResDto[]> {
    // Since the controller doesn't have a specific endpoint for order ID,
    // we'll get all status history and filter by order ID on the client side
    console.log(`Fetching all status history from: ${this.apiUrl}`);
    return this.http.get<OrderStatusHistoryResDto[]>(this.apiUrl).pipe(
      map(allHistory => {
        console.log(`All status history received:`, allHistory);
        const filteredHistory = allHistory.filter(history => history.orderId === orderId);
        console.log(`Filtered history for order ${orderId}:`, filteredHistory);
        return filteredHistory;
      })
    );
  }
} 