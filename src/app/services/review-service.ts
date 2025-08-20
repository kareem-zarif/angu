import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environment/environment';
import { ReviewCreateDto, ReviewResDto, ReviewUpdateDto } from '../models/i-reviews';
import { Auth } from './auth';

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private baseUrl = `${environment.apiUrl}/Review`; 
  
  constructor(
    private http: HttpClient,
    private auth: Auth
  ) {}

  // Get all reviews
  getAllReviews(): Observable<ReviewResDto[]> {
    return this.http.get<ReviewResDto[]>(`${this.baseUrl}`);
  }

  // Get review by ID
  getReviewById(id: string): Observable<ReviewResDto> {
    return this.http.get<ReviewResDto>(`${this.baseUrl}/${id}`);
  }

  // Get reviews by product ID
  getReviewsByProduct(productId: string): Observable<ReviewResDto[]> {
    // Since the backend doesn't have a specific endpoint for product reviews,
    // we'll get all reviews and filter them on the frontend
    return this.http.get<ReviewResDto[]>(`${this.baseUrl}`).pipe(
      map(reviews => {
        console.log('All reviews from API:', reviews);
        console.log('Looking for reviews for productId:', productId);
        
        // For now, return all reviews since the backend response structure might not include productId
        // You can implement proper filtering once you confirm the backend response structure
        console.log(`Returning all reviews (${reviews.length}) for debugging`);
        return reviews;
      })
    );
  }

  // Add a new review
  addReview(reviewData: ReviewCreateDto): Observable<ReviewResDto> {
    return this.http.post<ReviewResDto>(`${this.baseUrl}`, reviewData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getAuthToken()}`
      }
    });
  }

  // Update a review
  updateReview(reviewData: ReviewUpdateDto): Observable<ReviewResDto> {
    return this.http.put<ReviewResDto>(`${this.baseUrl}`, reviewData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getAuthToken()}`
      }
    });
  }

  // Delete a review
  deleteReview(id: string): Observable<ReviewResDto> {
    return this.http.delete<ReviewResDto>(`${this.baseUrl}/${id}`, {
      headers: {
        'Authorization': `Bearer ${this.getAuthToken()}`
      }
    });
  }

  private getAuthToken(): string {
    return this.auth.getToken() || '';
  }
}