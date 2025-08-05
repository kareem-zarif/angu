import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IProduct } from '../models/i-product';
import { environment } from '../../environment/environment';

@Injectable({
  providedIn: 'root'
})
export class RecommendationService {
  private apiUrl = environment.apiUrl;

  // constructor(private http: HttpClient) {}
  private http = inject(HttpClient)

  getRecommendations(userId: string): Observable<IProduct[]> {
    return this.http.get<IProduct[]>(`${this.apiUrl}/Recommendation/${userId}`);
  }
}
