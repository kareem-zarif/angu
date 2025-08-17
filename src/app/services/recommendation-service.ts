import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IProduct } from '../models/i-product';
import { environment } from '../../environment/environment';

@Injectable({
  providedIn: 'root'
})
export class RecommendationService {
  private baseUrl = `${environment.apiUrl}/recommendation`;

  constructor(private http: HttpClient) {}

  getRecommendations(userId: string): Observable<IProduct[]> {
    return this.http.get<IProduct[]>(`${this.baseUrl}/recommendations/${userId}`);
  }

  getBestSellers(): Observable<any[]> {
    return this.http.get<IProduct[]>(`${this.baseUrl}/bestsellers`);
  }

  getNewReleases(): Observable<IProduct[]> {
    return this.http.get<IProduct[]>(`${this.baseUrl}/newreleases`);
  }
}
