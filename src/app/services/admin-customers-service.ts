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
  notifications: any[];
  reports: any[];
}

export interface CustomerCreateDto {
  firstName: string;
  lastName: string;
  phoneNumber: string;
}

export interface CustomerUpdateDto {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
}

@Injectable({ providedIn: 'root' })
export class AdminCustomersService {
  // Try admin endpoint first, fallback to regular endpoint
  private apiUrl = `${environment.apiUrl}/Customer`;
  private fallbackApiUrl = `${environment.apiUrl}/Customer`;

  constructor(private http: HttpClient) {}

  getCustomers(): Observable<Customer[]> {
    return this.http.get<Customer[]>(this.apiUrl).pipe(
      tap(customers => console.log('✅ Customers fetched:', customers.length))
    );
  }

  getCustomerById(id: string): Observable<Customer> {
    return this.http.get<Customer>(`${this.apiUrl}/${id}`);
  }

  createCustomer(customer: CustomerCreateDto): Observable<Customer> {
    // Backend create is commented out; keeping JSON shape aligned in case it's enabled later
    const payload = {
      firstName: customer.firstName,
      lastName: customer.lastName,
      phoneNumber: customer.phoneNumber
    };
    return this.http.post<Customer>(this.apiUrl, payload);
  }

  updateCustomer(customer: CustomerUpdateDto): Observable<Customer> {
    // Ensure payload uses phoneNumber to match backend CustomerUpdateDto
    const payload = {
      id: customer.id,
      firstName: customer.firstName,
      lastName: customer.lastName,
      phoneNumber: customer.phoneNumber
    };
    return this.http.put<Customer>(this.apiUrl, payload);
  }

  deleteCustomer(id: string): Observable<Customer> {
    return this.http.delete<Customer>(`${this.apiUrl}/${id}`);
  }
}
