import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SalesReport {
  period: string;
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  topProducts: any[];
  salesByCategory: any[];
  salesByDate: any[];
}

export interface EarningsReport {
  period: string;
  grossEarnings: number;
  netEarnings: number;
  platformFees: number;
  taxes: number;
  pendingPayouts: number;
  totalPayouts: number;
  earningsByMonth: any[];
}

export interface ProductPerformance {
  productId: string;
  productName: string;
  totalSales: number;
  totalRevenue: number;
  unitsSold: number;
  averageRating: number;
  totalReviews: number;
  conversionRate: number;
}

export interface CustomerAnalytics {
  totalCustomers: number;
  newCustomers: number;
  repeatCustomers: number;
  averageCustomerValue: number;
  topCustomers: any[];
  customerRetentionRate: number;
}

export interface ReportFilter {
  dateFrom?: string;
  dateTo?: string;
  categoryId?: string;
  productId?: string;
  customerId?: string;
  period?: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

@Injectable({
  providedIn: 'root'
})
export class SellerReportsService {
  private apiUrl = 'https://localhost:7253/api/Seller/Reports';

  constructor(private http: HttpClient) {}

  // Get sales report
  getSalesReport(filter?: ReportFilter): Observable<SalesReport> {
    let url = `${this.apiUrl}/sales`;
    if (filter) {
      const params = new URLSearchParams();
      if (filter.dateFrom) params.append('dateFrom', filter.dateFrom);
      if (filter.dateTo) params.append('dateTo', filter.dateTo);
      if (filter.categoryId) params.append('categoryId', filter.categoryId);
      if (filter.productId) params.append('productId', filter.productId);
      if (filter.period) params.append('period', filter.period);
      
      if (params.toString()) {
        url += '?' + params.toString();
      }
    }
    return this.http.get<SalesReport>(url);
  }

  // Get earnings report
  getEarningsReport(filter?: ReportFilter): Observable<EarningsReport> {
    let url = `${this.apiUrl}/earnings`;
    if (filter) {
      const params = new URLSearchParams();
      if (filter.dateFrom) params.append('dateFrom', filter.dateFrom);
      if (filter.dateTo) params.append('dateTo', filter.dateTo);
      if (filter.period) params.append('period', filter.period);
      
      if (params.toString()) {
        url += '?' + params.toString();
      }
    }
    return this.http.get<EarningsReport>(url);
  }

  // Get product performance report
  getProductPerformanceReport(filter?: ReportFilter): Observable<ProductPerformance[]> {
    let url = `${this.apiUrl}/product-performance`;
    if (filter) {
      const params = new URLSearchParams();
      if (filter.dateFrom) params.append('dateFrom', filter.dateFrom);
      if (filter.dateTo) params.append('dateTo', filter.dateTo);
      if (filter.categoryId) params.append('categoryId', filter.categoryId);
      
      if (params.toString()) {
        url += '?' + params.toString();
      }
    }
    return this.http.get<ProductPerformance[]>(url);
  }

  // Get customer analytics
  getCustomerAnalytics(filter?: ReportFilter): Observable<CustomerAnalytics> {
    let url = `${this.apiUrl}/customer-analytics`;
    if (filter) {
      const params = new URLSearchParams();
      if (filter.dateFrom) params.append('dateFrom', filter.dateFrom);
      if (filter.dateTo) params.append('dateTo', filter.dateTo);
      
      if (params.toString()) {
        url += '?' + params.toString();
      }
    }
    return this.http.get<CustomerAnalytics>(url);
  }

  // Get revenue trends
  getRevenueTrends(period: string = 'monthly'): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/revenue-trends?period=${period}`);
  }

  // Get top selling products
  getTopSellingProducts(limit: number = 10, filter?: ReportFilter): Observable<any[]> {
    let url = `${this.apiUrl}/top-products?limit=${limit}`;
    if (filter) {
      const params = new URLSearchParams();
      if (filter.dateFrom) params.append('dateFrom', filter.dateFrom);
      if (filter.dateTo) params.append('dateTo', filter.dateTo);
      if (filter.categoryId) params.append('categoryId', filter.categoryId);
      
      if (params.toString()) {
        url += '&' + params.toString();
      }
    }
    return this.http.get<any[]>(url);
  }

  // Get sales by category
  getSalesByCategory(filter?: ReportFilter): Observable<any[]> {
    let url = `${this.apiUrl}/sales-by-category`;
    if (filter) {
      const params = new URLSearchParams();
      if (filter.dateFrom) params.append('dateFrom', filter.dateFrom);
      if (filter.dateTo) params.append('dateTo', filter.dateTo);
      
      if (params.toString()) {
        url += '?' + params.toString();
      }
    }
    return this.http.get<any[]>(url);
  }

  // Export report
  exportReport(reportType: string, filter?: ReportFilter): Observable<Blob> {
    let url = `${this.apiUrl}/export/${reportType}`;
    if (filter) {
      const params = new URLSearchParams();
      if (filter.dateFrom) params.append('dateFrom', filter.dateFrom);
      if (filter.dateTo) params.append('dateTo', filter.dateTo);
      if (filter.categoryId) params.append('categoryId', filter.categoryId);
      if (filter.productId) params.append('productId', filter.productId);
      if (filter.period) params.append('period', filter.period);
      
      if (params.toString()) {
        url += '?' + params.toString();
      }
    }
    return this.http.get(url, { responseType: 'blob' });
  }

  // Get real-time dashboard data
  getRealTimeDashboard(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/real-time-dashboard`);
  }

  // Get comparison report
  getComparisonReport(period1: string, period2: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/comparison?period1=${period1}&period2=${period2}`);
  }
} 