import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../environment/environment';

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  PhoneNumber: string;
  ordersCount: number;
  orders: any[];
  paymentMethods: any[];
  messages: any[];
  reviews: any[];
  wishlist: any;
  cart: any;
  notifications: any[];
  reports: any[];
}

export interface CustomerCreateDto {
  firstName: string;
  lastName: string;
  phone: string;
}

export interface CustomerUpdateDto {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
}

@Injectable({ providedIn: 'root' })
export class AdminCustomersService {
  // Try admin endpoint first, fallback to regular endpoint
  private apiUrl = `${environment.apiUrl}/admin/Customer`;
  private fallbackApiUrl = `${environment.apiUrl}/Customer`;

  constructor(private http: HttpClient) {}

  getCustomers(): Observable<Customer[]> {
    console.log('🔍 AdminCustomersService: Trying admin endpoint:', this.apiUrl);
    return this.http.get<Customer[]>(this.apiUrl).pipe(
      tap(customers => console.log('✅ Admin endpoint successful, got customers:', customers.length)),
      catchError(error => {
        console.log('⚠️ Admin endpoint failed, trying fallback:', this.fallbackApiUrl);
        return this.http.get<Customer[]>(this.fallbackApiUrl).pipe(
          tap(customers => console.log('✅ Fallback endpoint successful, got customers:', customers.length)),
          catchError(fallbackError => {
            console.error('❌ Both endpoints failed:', error, fallbackError);
            throw fallbackError;
          })
        );
      })
    );
  }

  getCustomerById(id: string): Observable<Customer> {
    return this.http.get<Customer>(`${this.apiUrl}/${id}`);
  }

  createCustomer(customer: CustomerCreateDto): Observable<Customer> {
    const formData = new FormData();
    formData.append('firstName', customer.firstName);
    formData.append('lastName', customer.lastName);
    formData.append('phone', customer.phone);

    return this.http.post<Customer>(this.apiUrl, formData);
  }

  updateCustomer(customer: CustomerUpdateDto): Observable<Customer> {
    return this.http.put<Customer>(this.apiUrl, customer);
  }

  deleteCustomer(id: string): Observable<Customer> {
    return this.http.delete<Customer>(`${this.apiUrl}/${id}`);
  }
}
