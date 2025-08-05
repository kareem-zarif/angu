import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environment/environment';

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

export enum OrderStatus {
  Pending = 1,
  Confirmed = 2,
  Shipped = 3,
  Deliverd = 4, // Note: matches backend enum spelling
  Cancelled = 5,
  Returned = 6
}

@Injectable({
  providedIn: 'root'
})
export class OrderStatusHistoryService {
  private apiUrl = `${environment.apiUrl}/OrderStatusHistory`;

  constructor(private http: HttpClient) {}

  // Get all order status histories
  getOrderStatusHistories(): Observable<OrderStatusHistoryResDto[]> {
    return this.http.get<OrderStatusHistoryResDto[]>(this.apiUrl);
  }

  // Get order status history by ID
  getOrderStatusHistoryById(id: string): Observable<OrderStatusHistoryResDto> {
    return this.http.get<OrderStatusHistoryResDto>(`${this.apiUrl}/${id}`);
  }

  // Create new order status history
  createOrderStatusHistory(orderStatusHistory: OrderStatusHistoryCreateDto): Observable<OrderStatusHistoryResDto> {
    return this.http.post<OrderStatusHistoryResDto>(this.apiUrl, orderStatusHistory);
  }

  // Update order status history
  updateOrderStatusHistory(orderStatusHistory: OrderStatusHistoryUpdateDto): Observable<OrderStatusHistoryResDto> {
    return this.http.put<OrderStatusHistoryResDto>(this.apiUrl, orderStatusHistory);
  }

  // Delete order status history
  deleteOrderStatusHistory(id: string): Observable<OrderStatusHistoryResDto> {
    return this.http.delete<OrderStatusHistoryResDto>(`${this.apiUrl}/${id}`);
  }

  // Get order status histories by order ID
  getOrderStatusHistoriesByOrderId(orderId: string): Observable<OrderStatusHistoryResDto[]> {
    // First try the specific endpoint, if not available, get all and filter
    return this.http.get<OrderStatusHistoryResDto[]>(`${this.apiUrl}/order/${orderId}`).pipe(
      catchError(error => {
        console.log('Specific endpoint not found, trying to get all and filter...');
        // If specific endpoint doesn't exist, get all and filter by orderId
        return this.getOrderStatusHistories().pipe(
          map(allHistory => allHistory.filter(history => history.orderId === orderId))
        );
      })
    );
  }
}
