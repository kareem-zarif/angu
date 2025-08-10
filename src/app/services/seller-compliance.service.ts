import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CompliancePolicy {
  id: string;
  name: string;
  description: string;
  category: 'product' | 'shipping' | 'returns' | 'pricing' | 'safety';
  status: 'active' | 'inactive' | 'pending';
  requirements: string[];
  lastUpdated: string;
  effectiveDate: string;
}

export interface ComplianceViolation {
  id: string;
  productId: string;
  productName: string;
  policyId: string;
  policyName: string;
  violationType: 'critical' | 'warning' | 'info';
  description: string;
  detectedDate: string;
  status: 'open' | 'resolved' | 'ignored';
  resolutionDate?: string;
  resolutionNotes?: string;
}

export interface ComplianceReport {
  totalProducts: number;
  compliantProducts: number;
  nonCompliantProducts: number;
  criticalViolations: number;
  warnings: number;
  complianceScore: number;
  lastAuditDate: string;
}

export interface ProductCompliance {
  productId: string;
  productName: string;
  complianceStatus: 'compliant' | 'non_compliant' | 'pending_review';
  violations: ComplianceViolation[];
  lastChecked: string;
  complianceScore: number;
}

export interface ComplianceFilter {
  status?: string;
  category?: string;
  severity?: string;
  dateFrom?: string;
  dateTo?: string;
  productId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SellerComplianceService {
  private apiUrl = 'https://localhost:7253/api/Seller/Compliance';

  constructor(private http: HttpClient) {}

  // Get compliance policies
  getCompliancePolicies(): Observable<CompliancePolicy[]> {
    return this.http.get<CompliancePolicy[]>(`${this.apiUrl}/policies`);
  }

  // Get compliance policy by ID
  getCompliancePolicyById(id: string): Observable<CompliancePolicy> {
    return this.http.get<CompliancePolicy>(`${this.apiUrl}/policies/${id}`);
  }

  // Get compliance violations
  getComplianceViolations(filter?: ComplianceFilter): Observable<ComplianceViolation[]> {
    let url = `${this.apiUrl}/violations`;
    if (filter) {
      const params = new URLSearchParams();
      if (filter.status) params.append('status', filter.status);
      if (filter.category) params.append('category', filter.category);
      if (filter.severity) params.append('severity', filter.severity);
      if (filter.dateFrom) params.append('dateFrom', filter.dateFrom);
      if (filter.dateTo) params.append('dateTo', filter.dateTo);
      if (filter.productId) params.append('productId', filter.productId);
      
      if (params.toString()) {
        url += '?' + params.toString();
      }
    }
    return this.http.get<ComplianceViolation[]>(url);
  }

  // Get compliance report
  getComplianceReport(): Observable<ComplianceReport> {
    return this.http.get<ComplianceReport>(`${this.apiUrl}/report`);
  }

  // Get product compliance
  getProductCompliance(productId: string): Observable<ProductCompliance> {
    return this.http.get<ProductCompliance>(`${this.apiUrl}/products/${productId}/compliance`);
  }

  // Get all products compliance
  getAllProductsCompliance(): Observable<ProductCompliance[]> {
    return this.http.get<ProductCompliance[]>(`${this.apiUrl}/products/compliance`);
  }

  // Resolve violation
  resolveViolation(violationId: string, resolution: any): Observable<ComplianceViolation> {
    return this.http.put<ComplianceViolation>(`${this.apiUrl}/violations/${violationId}/resolve`, resolution);
  }

  // Ignore violation
  ignoreViolation(violationId: string, reason: string): Observable<ComplianceViolation> {
    return this.http.put<ComplianceViolation>(`${this.apiUrl}/violations/${violationId}/ignore`, { reason });
  }

  // Run compliance check
  runComplianceCheck(productId?: string): Observable<any> {
    let url = `${this.apiUrl}/check`;
    if (productId) {
      url += `?productId=${productId}`;
    }
    return this.http.post<any>(url, {});
  }

  // Get compliance audit log
  getComplianceAuditLog(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/audit-log`);
  }

  // Update product compliance
  updateProductCompliance(productId: string, complianceData: any): Observable<ProductCompliance> {
    return this.http.put<ProductCompliance>(`${this.apiUrl}/products/${productId}/compliance`, complianceData);
  }

  // Get compliance suggestions
  getComplianceSuggestions(productId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/products/${productId}/suggestions`);
  }

  // Export compliance report
  exportComplianceReport(filter?: ComplianceFilter): Observable<Blob> {
    let url = `${this.apiUrl}/export`;
    if (filter) {
      const params = new URLSearchParams();
      if (filter.status) params.append('status', filter.status);
      if (filter.category) params.append('category', filter.category);
      if (filter.severity) params.append('severity', filter.severity);
      if (filter.dateFrom) params.append('dateFrom', filter.dateFrom);
      if (filter.dateTo) params.append('dateTo', filter.dateTo);
      
      if (params.toString()) {
        url += '?' + params.toString();
      }
    }
    return this.http.get(url, { responseType: 'blob' });
  }

  // Get compliance dashboard
  getComplianceDashboard(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/dashboard`);
  }

  // Get compliance trends
  getComplianceTrends(period: string = 'monthly'): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/trends?period=${period}`);
  }

  // Get compliance alerts
  getComplianceAlerts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/alerts`);
  }

  // Mark alert as read
  markAlertAsRead(alertId: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/alerts/${alertId}/read`, {});
  }

  // Get compliance calendar
  getComplianceCalendar(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/calendar`);
  }

  // Schedule compliance check
  scheduleComplianceCheck(schedule: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/schedule`, schedule);
  }

  // Get compliance templates
  getComplianceTemplates(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/templates`);
  }

  // Apply compliance template
  applyComplianceTemplate(templateId: string, productId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/templates/${templateId}/apply`, { productId });
  }

  // Get compliance score
  getComplianceScore(productId?: string): Observable<number> {
    let url = `${this.apiUrl}/score`;
    if (productId) {
      url += `?productId=${productId}`;
    }
    return this.http.get<number>(url);
  }
} 