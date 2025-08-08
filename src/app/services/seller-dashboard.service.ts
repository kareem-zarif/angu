import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SellerDashboardStats {
  totalProducts: number;
  activeProducts: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalRevenue: number;
  monthlyRevenue: number;
  totalCustomers: number;
  averageRating: number;
  totalReviews: number;
  monthlyGrowth: number;
}

export interface SellerRecentActivity {
  id: number;
  type: 'order' | 'product' | 'customer' | 'review' | 'payment';
  title: string;
  description: string;
  time: string;
  status: 'pending' | 'completed' | 'cancelled';
  amount?: number;
}

export interface SellerHeaderStats {
  totalProducts: number;
  pendingOrders: number;
  totalEarnings: number;
  monthlyGrowth: number;
}

export interface SellerNotification {
  id: string;
  title: string;
  message: string;
  type: 'order' | 'payment' | 'review' | 'stock' | 'system';
  isRead: boolean;
  timestamp: Date;
}

export interface SellerRecentOrder {
  id: string;
  customerName: string;
  amount: number;
  status: string;
  date: Date;
}

@Injectable({
  providedIn: 'root'
})
export class SellerDashboardService {
  private apiUrl = 'https://localhost:7253/api/Seller';

  constructor(private http: HttpClient) {}

  // Get seller dashboard statistics
  getDashboardStats(): Observable<SellerDashboardStats> {
    return this.http.get<SellerDashboardStats>(`${this.apiUrl}/dashboard/stats`);
  }

  // Get seller recent activities
  getRecentActivities(): Observable<SellerRecentActivity[]> {
    return this.http.get<SellerRecentActivity[]>(`${this.apiUrl}/dashboard/recent-activities`);
  }

  // Get seller recent orders
  getRecentOrders(): Observable<SellerRecentOrder[]> {
    return this.http.get<SellerRecentOrder[]>(`${this.apiUrl}/dashboard/recent-orders`);
  }

  // Get seller header statistics
  getHeaderStats(): Observable<SellerHeaderStats> {
    return this.http.get<SellerHeaderStats>(`${this.apiUrl}/dashboard/header-stats`);
  }

  // Get seller search results
  searchGlobal(query: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/dashboard/search?query=${query}`);
  }

  // Get seller notifications
  getNotifications(): Observable<SellerNotification[]> {
    return this.http.get<SellerNotification[]>(`${this.apiUrl}/dashboard/notifications`);
  }

  // Mark notification as read
  markNotificationAsRead(notificationId: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/dashboard/notifications/${notificationId}/read`, {});
  }

  // Mark all notifications as read
  markAllNotificationsAsRead(): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/dashboard/notifications/mark-all-read`, {});
  }

  // Get seller profile
  getSellerProfile(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/profile`);
  }

  // Update seller profile
  updateSellerProfile(profile: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/profile`, profile);
  }
} 