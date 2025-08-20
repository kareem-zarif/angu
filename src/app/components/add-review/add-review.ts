import { Component, OnInit, Input, OnDestroy, Output, EventEmitter } from '@angular/core';
import { ReviewService } from '../../services/review-service';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Auth } from '../../services/auth';
import { ReviewCreateDto } from '../../models/i-reviews';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-add-review',
  standalone: true,
  templateUrl: './add-review.html',
  imports: [FormsModule, ReactiveFormsModule, RouterModule],
})
export class AddReviewComponent implements OnInit, OnDestroy {
  @Input() productId!: string;
  @Output() reviewAdded = new EventEmitter<void>();
  
  reviewForm!: FormGroup;
  loggedInCustomerId: string | null = null;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';

  // stream used to clean subscriptions on destroy
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private reviewService: ReviewService,
    private auth: Auth
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.subscribeToCurrentUser();
  }

  ngOnDestroy(): void {
    // تنظيف كل الاشتراكات
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.reviewForm = this.fb.group({
      rating: ['', [Validators.required, Validators.min(1), Validators.max(5)]],
      comment: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  /**
   * الاشتراك في currentUser$ بدل القراءة مرة واحدة من getCurrentUser().
   * هذا يضمن أن customerId يتحدث تلقائياً لو المستخدم سجل الدخول بعد تحميل الصفحة.
   */
  private subscribeToCurrentUser(): void {
    this.auth.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        if (user) {
          this.loggedInCustomerId = user.UserId;
          console.log('Current User (from stream):', user);
          console.log('Customer ID:', this.loggedInCustomerId);
        } else {
          this.loggedInCustomerId = null;
          console.warn('No user logged in (stream)');
        }
      });
  }

  submitReview() {
    console.log('Submit review called with:', {
      formValid: this.reviewForm.valid,
      formValue: this.reviewForm.value,
      productId: this.productId,
      customerId: this.loggedInCustomerId
    });

    if (this.reviewForm.valid && this.productId && this.loggedInCustomerId) {
      this.isSubmitting = true;
      this.errorMessage = '';
      this.successMessage = '';

      const reviewData: ReviewCreateDto = {
        rating: this.reviewForm.value.rating,
        comment: this.reviewForm.value.comment,
        productId: this.productId,
        customerId: this.loggedInCustomerId
      };

      console.log('Submitting review data:', reviewData);

      this.reviewService.addReview(reviewData).subscribe({
        next: (res) => {
          console.log('Review added successfully:', res);
          this.successMessage = 'Review submitted successfully!';
          this.reviewForm.reset();
          this.isSubmitting = false;
          
          // Add a small delay to ensure backend has processed the review
          setTimeout(() => {
            // Emit event to refresh reviews
            this.reviewAdded.emit();
          }, 500);
          
          // Clear success message after 3 seconds
          setTimeout(() => {
            this.successMessage = '';
          }, 3000);
        },
        error: (err) => {
          console.error('Error submitting review:', err);
          console.error('Error details:', {
            status: err.status,
            statusText: err.statusText,
            error: err.error,
            message: err.message
          });
          this.errorMessage = err.error?.message || 'Failed to submit review. Please try again.';
          this.isSubmitting = false;
          
          // Clear error message after 5 seconds
          setTimeout(() => {
            this.errorMessage = '';
          }, 5000);
        }
      });
    } else {
      console.warn('Cannot submit review:', {
        formValid: this.reviewForm.valid,
        productId: this.productId,
        customerId: this.loggedInCustomerId,
        formErrors: this.reviewForm.errors,
        ratingErrors: this.reviewForm.get('rating')?.errors,
        commentErrors: this.reviewForm.get('comment')?.errors
      });
      
      if (!this.loggedInCustomerId) {
        this.errorMessage = 'Please log in to submit a review.';
      } else if (!this.reviewForm.valid) {
        this.errorMessage = 'Please fill in all required fields correctly.';
      }
    }
  }

  // Helper method to check if user can submit review
  canSubmitReview(): boolean {
    return this.reviewForm.valid && !!this.loggedInCustomerId && !this.isSubmitting;
  }
}
