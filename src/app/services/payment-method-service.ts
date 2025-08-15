import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../environment/environment';
import { IPaymentMethod, PaymentMethodType } from '../models/i-payment-method';

@Injectable({
  providedIn: 'root'
})
export class PaymentMethodService {
  private apiUrl = `${environment.apiUrl}/PaymentMethod`;

  constructor(private http: HttpClient) { }

  getPaymentMethods(customerId: string): Observable<IPaymentMethod[]> {
    return this.http.get<IPaymentMethod[]>(`${this.apiUrl}?customerId=${customerId}`);
  }

  getPaymentMethodById(id: string): Observable<IPaymentMethod> {
    return this.http.get<IPaymentMethod>(`${this.apiUrl}/${id}`);
  }

  createPaymentMethod(paymentMethod: PaymentMethodCreateDto): Observable<IPaymentMethod> {
    return this.http.post<IPaymentMethod>(this.apiUrl, paymentMethod);
  }

  updatePaymentMethod(id: string, paymentMethod: PaymentMethodCreateDto): Observable<IPaymentMethod> {
    return this.http.put<IPaymentMethod>(`${this.apiUrl}/${id}`, paymentMethod);
  }

  deletePaymentMethod(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getDefaultPaymentMethod(customerId: string): Observable<IPaymentMethod | undefined> {
  return this.getPaymentMethods(customerId).pipe(
    map(paymentMethods => {
      if (!paymentMethods || paymentMethods.length === 0) return undefined;
      const defaultMethod = paymentMethods.find(pm => pm.isDefault) ?? paymentMethods[0];
      console.log('Default Payment Method:', defaultMethod);
      return defaultMethod;
    })
  );
}

}


// Define PaymentMethodCreateDto if not already defined
export interface PaymentMethodCreateDto {
  paymentType: PaymentMethodType;
  isDefault?: boolean;
  cardNumber?: string;
  cardHolderName?: string;
  expireDate?: string;
  cvv?: string;
  phoneNumber?: string;
  fawryCode?: string;
  customerId: string;
}


