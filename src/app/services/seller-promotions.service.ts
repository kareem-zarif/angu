import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Promotion {
  id: string;
  name: string;
  description: string;
  type: 'percentage' | 'fixed' | 'free_shipping' | 'buy_one_get_one';
  value: number;
  minimumOrderAmount?: number;
  maximumDiscount?: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  usageLimit?: number;
  usedCount: number;
  applicableProducts: string[];
  applicableCategories: string[];
  customerGroups: string[];
  code?: string;
  autoApply: boolean;
}

export interface PromotionStats {
  totalPromotions: number;
  activePromotions: number;
  totalUsage: number;
  totalDiscount: number;
  averageDiscount: number;
  topPromotions: Promotion[];
}

export interface PromotionCreateDto {
  name: string;
  description: string;
  type: 'percentage' | 'fixed' | 'free_shipping' | 'buy_one_get_one';
  value: number;
  minimumOrderAmount?: number;
  maximumDiscount?: number;
  startDate: string;
  endDate: string;
  usageLimit?: number;
  applicableProducts?: string[];
  applicableCategories?: string[];
  customerGroups?: string[];
  code?: string;
  autoApply: boolean;
}

export interface PromotionUpdateDto {
  id: string;
  name?: string;
  description?: string;
  value?: number;
  minimumOrderAmount?: number;
  maximumDiscount?: number;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
  usageLimit?: number;
  applicableProducts?: string[];
  applicableCategories?: string[];
  customerGroups?: string[];
  autoApply?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SellerPromotionsService {
  private apiUrl = 'https://localhost:7253/api/Seller/Promotions';

  constructor(private http: HttpClient) {}

  // Get all promotions
  getPromotions(): Observable<Promotion[]> {
    return this.http.get<Promotion[]>(this.apiUrl);
  }

  // Get promotion by ID
  getPromotionById(id: string): Observable<Promotion> {
    return this.http.get<Promotion>(`${this.apiUrl}/${id}`);
  }

  // Create new promotion
  createPromotion(promotion: PromotionCreateDto): Observable<Promotion> {
    return this.http.post<Promotion>(this.apiUrl, promotion);
  }

  // Update promotion
  updatePromotion(promotion: PromotionUpdateDto): Observable<Promotion> {
    return this.http.put<Promotion>(`${this.apiUrl}/${promotion.id}`, promotion);
  }

  // Delete promotion
  deletePromotion(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  // Get promotion statistics
  getPromotionStats(): Observable<PromotionStats> {
    return this.http.get<PromotionStats>(`${this.apiUrl}/stats`);
  }

  // Get active promotions
  getActivePromotions(): Observable<Promotion[]> {
    return this.http.get<Promotion[]>(`${this.apiUrl}/active`);
  }

  // Toggle promotion status
  togglePromotionStatus(id: string, isActive: boolean): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/status`, { isActive });
  }

  // Get promotion usage analytics
  getPromotionAnalytics(promotionId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${promotionId}/analytics`);
  }

  // Get promotion performance
  getPromotionPerformance(promotionId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${promotionId}/performance`);
  }

  // Duplicate promotion
  duplicatePromotion(id: string): Observable<Promotion> {
    return this.http.post<Promotion>(`${this.apiUrl}/${id}/duplicate`, {});
  }

  // Get promotion templates
  getPromotionTemplates(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/templates`);
  }

  // Create promotion from template
  createFromTemplate(templateId: string, customizations: any): Observable<Promotion> {
    return this.http.post<Promotion>(`${this.apiUrl}/templates/${templateId}`, customizations);
  }

  // Validate promotion code
  validatePromotionCode(code: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/validate-code`, { code });
  }

  // Get promotion usage history
  getPromotionUsageHistory(promotionId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${promotionId}/usage-history`);
  }

  // Export promotion data
  exportPromotionData(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/export`, { responseType: 'blob' });
  }

  // Get promotion suggestions
  getPromotionSuggestions(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/suggestions`);
  }

  // Bulk update promotions
  bulkUpdatePromotions(updates: any[]): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/bulk-update`, updates);
  }

  // Get promotion impact analysis
  getPromotionImpactAnalysis(promotionId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${promotionId}/impact-analysis`);
  }

  // Schedule promotion
  schedulePromotion(promotionId: string, schedule: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${promotionId}/schedule`, schedule);
  }

  // Get promotion calendar
  getPromotionCalendar(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/calendar`);
  }
} 