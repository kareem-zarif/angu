import { Component, OnDestroy, OnInit } from '@angular/core';
import { PaymentService } from '../../../services/payment-service';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Checkout } from '../../../models/i-payment';
import { Subject, takeUntil } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-payment',
  imports: [FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './payment.html',
  styleUrl: './payment.css'
})
export class PaymentComponent implements OnInit, OnDestroy {
  paymentForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private paymentService: PaymentService
  ) {
    this.paymentForm = this.createForm();
  }

  ngOnInit(): void {
    this.initializeForm();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Creates the reactive form
   */
  private createForm(): FormGroup {
    return this.fb.group({
      orderId: ['', [Validators.required, Validators.minLength(1)]]
    });
  }

  /**
   * Initializes the form and resets states
   */
  private initializeForm(): void {
    this.clearMessages();
    this.isLoading = false;
  }

  /**
   * Processes the payment checkout
   */
  onSubmit(): void {
    if (this.paymentForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    const orderId = this.paymentForm.get('orderId')?.value?.trim();
    if (!orderId) {
      this.setError('Order ID is required');
      return;
    }

    this.processPayment(orderId);
  }

  /**
   * Handles the payment processing flow
   * @param orderId The order ID to process
   */
  private processPayment(orderId: string): void {
    this.setLoadingState(true);
    this.clearMessages();

    this.paymentService.createCheckoutSession(orderId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (checkout: Checkout) => {
          this.handlePaymentSuccess(checkout);
        },
        error: (error: Error) => {
          this.handlePaymentError(error);
        }
      });
  }

  /**
   * Handles successful checkout session creation
   * @param checkout The checkout response
   */
  private handlePaymentSuccess(checkout: Checkout): void {
    this.setLoadingState(false);
    this.setSuccess('Redirecting to payment page...');
    
    // Small delay to show success message before redirect
    setTimeout(() => {
      this.paymentService.redirectToPayment(checkout.redirectionUrl);
    }, 1500);
  }

  /**
   * Handles payment processing errors
   * @param error The error that occurred
   */
  private handlePaymentError(error: Error): void {
    this.setLoadingState(false);
    this.setError(error.message || 'Payment processing failed. Please try again.');
  }

  /**
   * Marks all form controls as touched to show validation errors
   */
  private markFormGroupTouched(): void {
    Object.keys(this.paymentForm.controls).forEach(key => {
      this.paymentForm.get(key)?.markAsTouched();
    });
  }

  /**
   * Sets loading state
   * @param loading Loading state
   */
  private setLoadingState(loading: boolean): void {
    this.isLoading = loading;
  }

  /**
   * Sets error message and clears success message
   * @param message Error message
   */
  private setError(message: string): void {
    this.errorMessage = message;
    this.successMessage = '';
  }

  /**
   * Sets success message and clears error message
   * @param message Success message
   */
  private setSuccess(message: string): void {
    this.successMessage = message;
    this.errorMessage = '';
  }

  /**
   * Clears all messages
   */
  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  /**
   * Resets the form and all states
   */
  onReset(): void {
    this.paymentForm.reset();
    this.clearMessages();
    this.setLoadingState(false);
  }

  /**
   * Gets form control for template access
   * @param controlName Name of the form control
   */
  getFormControl(controlName: string) {
    return this.paymentForm.get(controlName);
  }

  /**
   * Checks if form control has error and is touched
   * @param controlName Name of the form control
   */
  hasError(controlName: string): boolean {
    const control = this.getFormControl(controlName);
    return !!(control?.invalid && (control?.dirty || control?.touched));
  }
}
