import { catchError, map, Observable, throwError } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Checkout } from '../models/i-payment';
import { Injectable } from '@angular/core';

declare const Stripe: any;

@Injectable({
  providedIn: 'root'
})
export class PaymentService {

  private apiUrl = 'https://localhost:7253/api';

  // orderId: string = '9437fe91-37a5-4dfe-1ff6-08ddce3ce388';

  constructor(private http: HttpClient) {}

  /**
   * Creates a checkout session for the given order
   * @param orderId The ID of the order to checkout
   * @returns Observable<Checkout> containing session details
   */
  createCheckoutSession(orderId: string): Observable<Checkout> {
    const url = `${this.apiUrl}/Stripe/checkout`;
    
    // Create FormData to match [FromForm] parameter in .NET API
    const formData = new FormData();
    formData.append('orderId', orderId);

    return this.http.post<Checkout>(url, formData).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Redirects user to Stripe payment page
   * @param redirectionUrl The URL to redirect to
   */
  redirectToPayment(redirectionUrl: string): void {
    window.location.href = redirectionUrl;
  }

  /**
   * Processes the complete checkout flow
   * @param orderId The order ID to process
   * @returns Observable<boolean> indicating success
   */
  processCheckout(orderId: string): Observable<boolean> {
    return this.createCheckoutSession(orderId).pipe(
      map((checkout: Checkout) => {
        if (checkout.redirectionUrl) {
          this.redirectToPayment(checkout.redirectionUrl);
          return true;
        }
        throw new Error('No redirection URL provided');
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Handles HTTP errors
   * @param error The HTTP error response
   * @returns Observable<never> with error message
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Client Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Server Error ${error.status}: ${error.message}`;
      
      // Handle specific status codes
      switch (error.status) {
        case 400:
          errorMessage = 'Invalid order ID provided';
          break;
        case 404:
          errorMessage = 'Order not found';
          break;
        case 500:
          errorMessage = 'Payment service temporarily unavailable';
          break;
      }
    }
    
    console.error('Payment Service Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
