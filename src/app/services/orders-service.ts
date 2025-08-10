import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment/environment';

export interface OrderCreateDto {
  totalAmount: number;
  paymentMethodId?: string;
  customerId?: string;
  orderItems?: OrderItemCreateDto[];
}

export interface OrderReadDto {
  id: string;
  totalAmount: number;
  createdOn: Date;
  isExist: boolean;
  orderItems: OrderItemReadDto[];
  paymentType: PaymentMethodType;
}

export interface OrderResDto {
  id: string;
  paymentMethodName?: number;
  customerName?: string;
  totalAmount: number;
  paymentMethodId?: string;
  customerId?: string;
  orderItems: OrderItemResDto[];
}

export interface OrderUpdateDto extends OrderCreateDto {
  id: string;
}

export interface OrderItemCreateDto {
  productId: string;
  quantity: number;
  pricePerPiece: number;
}

export interface OrderItemReadDto {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  pricePerPiece: number;
  totalPrice: number;
  orderId: string;
}

export interface OrderItemResDto {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  pricePerPiece: number;
  totalPrice: number;
  orderId: string;
}

export enum PaymentMethodType {
  Cash = 1,
  Instapay = 2,
  VisaCard = 3,
  VodafoneCash = 4,
  OrangeCash = 5,
  Fawry = 6
}

@Injectable({
  providedIn: 'root'
})
export class OrdersService {
  private apiUrl = `${environment.apiUrl}/Order`;

  constructor(private http: HttpClient) {}

  // Get all orders
  getOrders(): Observable<OrderResDto[]> {
    return this.http.get<OrderResDto[]>(this.apiUrl);
  }

  // Get order by ID
  getOrderById(id: string): Observable<OrderResDto> {
    return this.http.get<OrderResDto>(`${this.apiUrl}/${id}`);
  }

  // Create new order
  createOrder(order: OrderCreateDto): Observable<OrderResDto> {
    return this.http.post<OrderResDto>(this.apiUrl, order);
  }

  // Update order
  updateOrder(order: OrderUpdateDto): Observable<OrderResDto> {
    return this.http.put<OrderResDto>(this.apiUrl, order);
  }

  // Delete order
  deleteOrder(id: string): Observable<OrderResDto> {
    return this.http.delete<OrderResDto>(`${this.apiUrl}/${id}`);
  }
}
