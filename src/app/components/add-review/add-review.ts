import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { ReviewService } from '../../services/review-service';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Auth } from '../../services/auth';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-add-review',
  standalone: true,
  templateUrl: './add-review.html',
  imports: [FormsModule, ReactiveFormsModule],
})
export class AddReviewComponent implements OnInit, OnDestroy {
  @Input() productId!: string;
  reviewForm!: FormGroup;
  loggedInCustomerId: string | null = null;

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
      comment: ['', Validators.required]
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
    if (this.reviewForm.valid && this.productId && this.loggedInCustomerId) {
      const reviewData = {
        ...this.reviewForm.value,
        productId: this.productId,
        customerId: this.loggedInCustomerId
      };

      console.log('Submitting review data:', reviewData);

      this.reviewService.addReview(reviewData).subscribe({
        next: (res) => {
          console.log('Full API response:', res);
          console.log('Review added successfully:', res);
          this.reviewForm.reset();
        },
        error: (err) => {
          console.error('Error submitting review:', err);
          // يمكنك إضافة رسالة خطأ هنا
        }
      });
    } else {
      console.warn('Cannot submit review:', {
        formValid: this.reviewForm.valid,
        productId: this.productId,
        customerId: this.loggedInCustomerId
      });
    }
  }
}
