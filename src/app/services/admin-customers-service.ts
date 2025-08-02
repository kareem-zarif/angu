import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
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
  private apiUrl = 'https://localhost:7253/api/Customer';

  constructor(private http: HttpClient) {}

  getCustomers(): Observable<Customer[]> {
    return this.http.get<Customer[]>(this.apiUrl);
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