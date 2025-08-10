import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of, switchMap, take, tap, throwError } from 'rxjs';
import { environment } from '../../environment/environment';
import { CartService } from './cart.service';
import { PaymentService } from './payment-service';
import { IPaymentMethod, PaymentMethodType } from '../models/i-payment-method';
import { IOrder } from '../models/i-order';
import { PaymentMethodService } from './payment-method-service';
import { Auth } from './auth';

export interface OrderCreateDto {
  totalAmount: number;
  paymentMethodId?: string;
  customerId?: string;
  orderItems?: OrderItemCreateDto[];
}

// export interface OrderReadDto {
//   id: string;
//   totalAmount: number;
//   createdOn: Date;
//   isExist: boolean;
//   orderItems: OrderItemReadDto[];
//   paymentType: PaymentMethodType;
// }



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



@Injectable({
  providedIn: 'root'
})
export class OrdersService {
  private apiUrl = `${environment.apiUrl}/Order`;
  private paymentMethodUrl = `${environment.apiUrl}/PaymentMethod`;

  constructor(
    private http: HttpClient,
    private cartService: CartService,
    private paymentService: PaymentService,
    private paymentMethodService: PaymentMethodService,
  ) { }

  // Get all orders
  getOrders(): Observable<IOrder[]> {
    return this.http.get<IOrder[]>(`${this.apiUrl}`).pipe(
      catchError(error => {
        console.error('Error fetching orders:', error);
        return [];
      })
    );
  }

  getOrdersByCustomerId(customerId: string): Observable<IOrder[]> {
    return this.http.get<IOrder[]>(`${this.apiUrl}?customerId=${customerId}`).pipe(
      catchError(error => {
        console.error('Error fetching orders:', error);
        return [];
      })
    );
  }

  // Get order by ID
  getOrderById(id: string): Observable<IOrder> {
    return this.http.get<IOrder>(`${this.apiUrl}/${id}`);
  }

  // Create new order
  createOrder(order: OrderCreateDto): Observable<IOrder> {
    return this.http.post<IOrder>(this.apiUrl, order);
  }

  // Update order
  updateOrder(order: OrderUpdateDto): Observable<IOrder> {
    return this.http.put<IOrder>(this.apiUrl, order);
  }

  // Delete order
  deleteOrder(id: string): Observable<IOrder> {
    return this.http.delete<IOrder>(`${this.apiUrl}/${id}`);
  }

  getPaymentMethods(customerId: string): Observable<IPaymentMethod[]> {
    return this.http.get<IPaymentMethod[]>(`${this.paymentMethodUrl}?customerId=${customerId}`);
  }
  createOrderFromCart(customerId: string, selectedPaymentMethodId?: string): Observable<IOrder> {
    const getPaymentMethodId$ = selectedPaymentMethodId
      ? of(selectedPaymentMethodId)
      : this.paymentMethodService.getDefaultPaymentMethod(customerId).pipe(
        map(pm => pm?.id),
        switchMap(id => id ? of(id) : throwError(() => new Error('No payment method available')))
      );

    return getPaymentMethodId$.pipe(
      switchMap(paymentMethodId => {
        return this.paymentMethodService.getPaymentMethods(customerId).pipe(
          take(1),
          switchMap(paymentMethods => {
            if (!paymentMethods || paymentMethods.length === 0) {
              return throwError(() => new Error('No payment methods available for this customer'));
            }

            return this.cartService.getCartItems().pipe(
              take(1),
              switchMap(cartItems => {
                if (!cartItems || cartItems.length === 0) {
                  return throwError(() => new Error('Cart is empty'));
                }

                const orderItems: OrderItemCreateDto[] = cartItems.map(item => ({
                  productId: item.Product.id,
                  quantity: item.quantity,
                  unitPrice: this.cartService.calculateItemPrice(item) / item.quantity,
                  pricePerPiece: item.Product.pricePerPiece || 0
                }));

                const totalAmount = cartItems.reduce(
                  (total, item) => total + this.cartService.calculateItemPrice(item),
                  0
                );

                const order: OrderCreateDto = {
                  customerId,
                  totalAmount,
                  paymentMethodId: paymentMethodId || paymentMethods.find(pm => pm.isDefault)?.id,
                  orderItems
                };
                console.log('Order being sent:', order); // Debug log
                return this.http.post<IOrder>(this.apiUrl, order).pipe(
                  tap(response => {
                    this.cartService.clearCart(customerId);
                    this.paymentService.processCheckout(response.id, response.paymentMethodId).subscribe({
                      error: err => console.error('Payment failed:', err)
                    });
                  }),
                  catchError(err => throwError(() => new Error('Failed to create order')))
                );
              })
            );
          })
        );
      })
    );
  }


}




