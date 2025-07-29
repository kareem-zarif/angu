import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export enum OrderStatus {
  pending = 1,
  Confirmed = 2,
  Shipped = 3,
  Deliverd = 4,
  Cancelled = 5,
  Returned = 6
}

export interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  isSample: boolean;
  productId: string;
  orderId?: string;
  productName?: string;
}

export interface Order {
  id: string;
  paymentMethodName?: number;
  customerName?: string;
  totalAmount: number;
  paymentMethodId?: string;
  customerId?: string;
  orderItems: OrderItem[];
  createdOn?: Date;
  currentStatus?: OrderStatus;
}

export interface OrderCreateDto {
  totalAmount: number;
  paymentMethodId?: string;
  customerId?: string;
  orderItems?: OrderItemCreateDto[];
}

export interface OrderUpdateDto extends OrderCreateDto {
  id: string;
}

export interface OrderItemCreateDto {
  quantity: number;
  unitPrice: number;
  isSample: boolean;
  productId: string;
  orderId?: string;
}

export interface OrderItemUpdateDto extends OrderItemCreateDto {
  id: string;
}

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

export interface OrderStatusHistoryUpdateDto {
  id: string;
  orderStatus: OrderStatus;
  orderId: string;
}

@Injectable({ providedIn: 'root' })
export class AdminOrdersService {
  private apiUrl = 'https://localhost:7253/api/Order';

  constructor(private http: HttpClient) {}

  getOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(this.apiUrl);
  }

  getOrderById(id: string): Observable<Order> {
    return this.http.get<Order>(`${this.apiUrl}/${id}`);
  }

  createOrder(order: OrderCreateDto): Observable<Order> {
    return this.http.post<Order>(this.apiUrl, order);
  }

  updateOrder(order: OrderUpdateDto): Observable<Order> {
    return this.http.put<Order>(this.apiUrl, order);
  }

  deleteOrder(id: string): Observable<Order> {
    return this.http.delete<Order>(`${this.apiUrl}/${id}`);
  }

  // Order Status History methods
  createOrderStatusHistory(statusHistory: OrderStatusHistoryCreateDto): Observable<OrderStatusHistory> {
    return this.http.post<OrderStatusHistory>(`${this.apiUrl}/status-history`, statusHistory);
  }

  updateOrderStatusHistory(statusHistory: OrderStatusHistoryUpdateDto): Observable<OrderStatusHistory> {
    return this.http.put<OrderStatusHistory>(`${this.apiUrl}/status-history`, statusHistory);
  }

  deleteOrderStatusHistory(id: string): Observable<OrderStatusHistory> {
    return this.http.delete<OrderStatusHistory>(`${this.apiUrl}/status-history/${id}`);
  }
} 