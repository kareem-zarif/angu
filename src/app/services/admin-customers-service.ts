import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../environment/environment';

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  ordersCount: number;
  orders: any[];
  paymentMethods: any[];
  messages: any[];
  reviews: any[];
  wishlist: any;
  cart: any;
  personNotification: any[];
  reports: any[];
}

export interface CustomerCreateDto {
  FirstName: string;
  LastName: string;
  PhoneNumber: string;
}

export interface CustomerUpdateDto {
  Id: string;
  FirstName: string;
  LastName: string;
  PhoneNumber: string;
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
    formData.append('FirstName', customer.FirstName);
    formData.append('LastName', customer.LastName);
    formData.append('PhoneNumber', customer.PhoneNumber);

    return this.http.post<Customer>(this.fallbackApiUrl, formData);
  }

  updateCustomer(customer: CustomerUpdateDto): Observable<Customer> {
    return this.http.put<Customer>(this.fallbackApiUrl, customer);
  }

  deleteCustomer(id: string): Observable<Customer> {
    return this.http.delete<Customer>(`${this.fallbackApiUrl}/${id}`);
  }
}
