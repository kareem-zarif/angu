import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environment/environment';

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private baseUrl = `${environment.apiUrl}/Review`; 
  constructor(private http: HttpClient) {}

  addReview(reviewData: any) {
    return this.http.post(`${this.baseUrl}`, reviewData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getAuthToken()}`
      }
    });
  }

  private getAuthToken(): string {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user).token : '';
  }
}