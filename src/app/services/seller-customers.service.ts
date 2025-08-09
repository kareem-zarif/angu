import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SellerCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string;
  averageOrderValue: number;
  customerType: 'new' | 'returning' | 'loyal';
  status: 'active' | 'inactive';
}

export interface CustomerInteraction {
  id: string;
  customerId: string;
  type: 'message' | 'review' | 'support' | 'order';
  title: string;
  message: string;
  date: string;
  status: 'pending' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
}

export interface CustomerStats {
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  loyalCustomers: number;
  averageCustomerValue: number;
  customerRetentionRate: number;
  topCustomers: SellerCustomer[];
}

export interface CustomerFilter {
  customerType?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  searchTerm?: string;
  page?: number;
  pageSize?: number;
}

@Injectable({
  providedIn: 'root'
})
export class SellerCustomersService {
  private apiUrl = 'https://localhost:7253/api/Seller/Customers';

  constructor(private http: HttpClient) {}

  // Get all customers
  getCustomers(filter?: CustomerFilter): Observable<SellerCustomer[]> {
    let url = this.apiUrl;
    if (filter) {
      const params = new URLSearchParams();
      if (filter.customerType) params.append('customerType', filter.customerType);
      if (filter.status) params.append('status', filter.status);
      if (filter.dateFrom) params.append('dateFrom', filter.dateFrom);
      if (filter.dateTo) params.append('dateTo', filter.dateTo);
      if (filter.searchTerm) params.append('searchTerm', filter.searchTerm);
      if (filter.page) params.append('page', filter.page.toString());
      if (filter.pageSize) params.append('pageSize', filter.pageSize.toString());
      
      if (params.toString()) {
        url += '?' + params.toString();
      }
    }
    return this.http.get<SellerCustomer[]>(url);
  }

  // Get customer by ID
  getCustomerById(id: string): Observable<SellerCustomer> {
    return this.http.get<SellerCustomer>(`${this.apiUrl}/${id}`);
  }

  // Get customer statistics
  getCustomerStats(): Observable<CustomerStats> {
    return this.http.get<CustomerStats>(`${this.apiUrl}/stats`);
  }

  // Get customer interactions
  getCustomerInteractions(customerId: string): Observable<CustomerInteraction[]> {
    return this.http.get<CustomerInteraction[]>(`${this.apiUrl}/${customerId}/interactions`);
  }

  // Create customer interaction
  createCustomerInteraction(customerId: string, interaction: any): Observable<CustomerInteraction> {
    return this.http.post<CustomerInteraction>(`${this.apiUrl}/${customerId}/interactions`, interaction);
  }

  // Update customer interaction
  updateCustomerInteraction(interactionId: string, interaction: any): Observable<CustomerInteraction> {
    return this.http.put<CustomerInteraction>(`${this.apiUrl}/interactions/${interactionId}`, interaction);
  }

  // Get customer orders
  getCustomerOrders(customerId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${customerId}/orders`);
  }

  // Get customer reviews
  getCustomerReviews(customerId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${customerId}/reviews`);
  }

  // Get customer analytics
  getCustomerAnalytics(customerId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${customerId}/analytics`);
  }

  // Get top customers
  getTopCustomers(limit: number = 10): Observable<SellerCustomer[]> {
    return this.http.get<SellerCustomer[]>(`${this.apiUrl}/top?limit=${limit}`);
  }

  // Get new customers
  getNewCustomers(limit: number = 10): Observable<SellerCustomer[]> {
    return this.http.get<SellerCustomer[]>(`${this.apiUrl}/new?limit=${limit}`);
  }

  // Get customer retention data
  getCustomerRetentionData(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/retention`);
  }

  // Export customer data
  exportCustomerData(filter?: CustomerFilter): Observable<Blob> {
    let url = `${this.apiUrl}/export`;
    if (filter) {
      const params = new URLSearchParams();
      if (filter.customerType) params.append('customerType', filter.customerType);
      if (filter.status) params.append('status', filter.status);
      if (filter.dateFrom) params.append('dateFrom', filter.dateFrom);
      if (filter.dateTo) params.append('dateTo', filter.dateTo);
      
      if (params.toString()) {
        url += '?' + params.toString();
      }
    }
    return this.http.get(url, { responseType: 'blob' });
  }

  // Send message to customer
  sendCustomerMessage(customerId: string, message: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${customerId}/messages`, message);
  }

  // Get customer messages
  getCustomerMessages(customerId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${customerId}/messages`);
  }

  // Mark customer as VIP
  markCustomerAsVIP(customerId: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${customerId}/vip`, {});
  }

  // Get customer preferences
  getCustomerPreferences(customerId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${customerId}/preferences`);
  }

  // Update customer preferences
  updateCustomerPreferences(customerId: string, preferences: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${customerId}/preferences`, preferences);
  }
} 