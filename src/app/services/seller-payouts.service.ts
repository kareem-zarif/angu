import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Payout {
  id: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  method: 'bank_transfer' | 'paypal' | 'stripe';
  accountDetails: string;
  requestedDate: string;
  processedDate?: string;
  reference: string;
  fees: number;
  netAmount: number;
}

export interface Transaction {
  id: string;
  orderId: string;
  amount: number;
  type: 'sale' | 'refund' | 'commission' | 'fee';
  status: 'pending' | 'completed' | 'failed';
  date: string;
  description: string;
  customerName: string;
  productName: string;
}

export interface PayoutStats {
  totalEarnings: number;
  availableBalance: number;
  pendingPayouts: number;
  totalPayouts: number;
  thisMonthEarnings: number;
  lastMonthEarnings: number;
}

export interface PayoutRequest {
  amount: number;
  method: 'bank_transfer' | 'paypal' | 'stripe';
  accountDetails: string;
}

@Injectable({
  providedIn: 'root'
})
export class SellerPayoutsService {
  private apiUrl = 'https://localhost:7253/api/Seller/Payouts';

  constructor(private http: HttpClient) {}

  // Get all payouts
  getPayouts(): Observable<Payout[]> {
    return this.http.get<Payout[]>(this.apiUrl);
  }

  // Get payout by ID
  getPayoutById(id: string): Observable<Payout> {
    return this.http.get<Payout>(`${this.apiUrl}/${id}`);
  }

  // Request new payout
  requestPayout(payoutRequest: PayoutRequest): Observable<Payout> {
    return this.http.post<Payout>(this.apiUrl, payoutRequest);
  }

  // Get payout statistics
  getPayoutStats(): Observable<PayoutStats> {
    return this.http.get<PayoutStats>(`${this.apiUrl}/stats`);
  }

  // Get transactions
  getTransactions(filter?: any): Observable<Transaction[]> {
    let url = `${this.apiUrl}/transactions`;
    if (filter) {
      const params = new URLSearchParams();
      if (filter.dateFrom) params.append('dateFrom', filter.dateFrom);
      if (filter.dateTo) params.append('dateTo', filter.dateTo);
      if (filter.type) params.append('type', filter.type);
      if (filter.status) params.append('status', filter.status);
      
      if (params.toString()) {
        url += '?' + params.toString();
      }
    }
    return this.http.get<Transaction[]>(url);
  }

  // Get transaction by ID
  getTransactionById(id: string): Observable<Transaction> {
    return this.http.get<Transaction>(`${this.apiUrl}/transactions/${id}`);
  }

  // Get available balance
  getAvailableBalance(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/available-balance`);
  }

  // Get pending payouts
  getPendingPayouts(): Observable<Payout[]> {
    return this.http.get<Payout[]>(`${this.apiUrl}/pending`);
  }

  // Get completed payouts
  getCompletedPayouts(): Observable<Payout[]> {
    return this.http.get<Payout[]>(`${this.apiUrl}/completed`);
  }

  // Cancel payout request
  cancelPayout(payoutId: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${payoutId}/cancel`, {});
  }

  // Get payout history
  getPayoutHistory(limit: number = 50): Observable<Payout[]> {
    return this.http.get<Payout[]>(`${this.apiUrl}/history?limit=${limit}`);
  }

  // Get transaction summary
  getTransactionSummary(period: string = 'monthly'): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/transaction-summary?period=${period}`);
  }

  // Export payout report
  exportPayoutReport(dateFrom?: string, dateTo?: string): Observable<Blob> {
    let url = `${this.apiUrl}/export`;
    if (dateFrom && dateTo) {
      url += `?dateFrom=${dateFrom}&dateTo=${dateTo}`;
    }
    return this.http.get(url, { responseType: 'blob' });
  }

  // Get payout methods
  getPayoutMethods(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/methods`);
  }

  // Add payout method
  addPayoutMethod(method: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/methods`, method);
  }

  // Update payout method
  updatePayoutMethod(methodId: string, method: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/methods/${methodId}`, method);
  }

  // Delete payout method
  deletePayoutMethod(methodId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/methods/${methodId}`);
  }

  // Get payout timeline
  getPayoutTimeline(payoutId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${payoutId}/timeline`);
  }

  // Get minimum payout amount
  getMinimumPayoutAmount(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/minimum-amount`);
  }

  // Validate payout request
  validatePayoutRequest(payoutRequest: PayoutRequest): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/validate`, payoutRequest);
  }
} 