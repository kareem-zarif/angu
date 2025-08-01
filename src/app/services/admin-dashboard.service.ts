import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  activeCustomers: number;
  totalProducts: number;
  totalSuppliers: number;
}

export interface RecentActivity {
  id: number;
  type: 'order' | 'customer' | 'product' | 'supplier';
  title: string;
  description: string;
  time: string;
  status: 'pending' | 'completed' | 'failed';
}

export interface AdminHeaderStats {
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  activeCustomers: number;
}

@Injectable({
  providedIn: 'root'
})
export class AdminDashboardService {
  private apiUrl = 'https://localhost:7253/api';

  constructor(private http: HttpClient) {}

  // Get dashboard statistics
  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/AdminDashboard/stats`);
  }

  // Get recent activities
  getRecentActivities(): Observable<RecentActivity[]> {
    return this.http.get<RecentActivity[]>(`${this.apiUrl}/AdminDashboard/recent-activities`);
  }

  // Get header statistics
  getHeaderStats(): Observable<AdminHeaderStats> {
    return this.http.get<AdminHeaderStats>(`${this.apiUrl}/AdminDashboard/header-stats`);
  }

  // Get search results
  searchGlobal(query: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/AdminDashboard/search?query=${query}`);
  }

  // Get notifications
  getNotifications(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/AdminDashboard/notifications`);
  }
} 