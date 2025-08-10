import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IProduct } from '../models/i-product';
import { environment } from '../../environment/environment';
@Injectable({
  providedIn: 'root'
})
@Injectable({
  providedIn: 'root'
})
export class RecommendationService {
  private baseUrl = environment.apiUrl + '/Recommendation'; // تأكد من الاسم صح

  constructor(private http: HttpClient) {}

  getRecommendations(userId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/${userId}`);
  }
}
