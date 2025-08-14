import { Component, OnInit, Input } from '@angular/core';
import { ReviewService } from '../../services/review-service';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-add-review',
  standalone: true,
  templateUrl: './add-review.html',
  imports: [FormsModule, ReactiveFormsModule],
})
export class AddReviewComponent implements OnInit {
  @Input() productId!: string;
  reviewForm!: FormGroup;
  loggedInCustomerId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private reviewService: ReviewService,
    private auth: Auth
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.getCurrentCustomerId();
  }

  private initializeForm(): void {
    this.reviewForm = this.fb.group({
      rating: ['', [Validators.required, Validators.min(1), Validators.max(5)]],
      comment: ['', Validators.required]
    });
  }

  private getCurrentCustomerId(): void {
    const currentUser = this.auth.getCurrentUser();
    if (currentUser) {
      this.loggedInCustomerId = currentUser.UserId;
      console.log('Current User:', currentUser);
      console.log('Customer ID:', this.loggedInCustomerId);
    } else {
      console.warn('No user logged in');
    }
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