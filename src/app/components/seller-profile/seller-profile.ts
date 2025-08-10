import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SellerService } from '../../services/seller.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-seller-profile',
  imports: [FormsModule, CommonModule, ReactiveFormsModule],
  templateUrl: './seller-profile.html',
  styleUrl: './seller-profile.css',
})
export class SellerProfile implements OnInit {
  profileForm!: FormGroup;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';
  redirectPath = '/seller'; // يمكنك تغييره من هنا

  constructor(
    private fb: FormBuilder,
    private sellerService: SellerService,
    public router: Router
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.checkExistingProfile();
  }

  // دالة لتغيير مكان التوجيه
  setRedirectPath(path: string): void {
    this.redirectPath = path;
  }

  private initForm(): void {
    this.profileForm = this.fb.group({
      storeName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      businessType: ['', [Validators.required, Validators.maxLength(50)]],
      description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^(\+2|002|02|01)[0-9]{8,11}$/)]],
      address: ['', [Validators.required, Validators.maxLength(200)]],
      websiteUrl: ['', [Validators.pattern(/^https?:\/\/.+/)]],
      storeLogoUrl: ['', [Validators.pattern(/^https?:\/\/.+/)]],
    });
  }

  private checkExistingProfile(): void {
    this.sellerService.getProfileStatus().subscribe({
      next: (status) => {
        if (status.isComplete && status.profileData) {
          // ✅ إذا كان الـ profile مكتمل، وجهه للصفحة الصحيحة بدلاً من إظهار الفورم
          console.log('Profile is already complete, redirecting...');
          this.successMessage = 'ملفك الشخصي مكتمل بالفعل، جاري التوجيه...';

          setTimeout(() => {
            this.router.navigate(['/about-us']); // أو أي صفحة تريدها للبائع
          }, 1500);

          return; // ✅ مهم: الخروج من الدالة هنا
        } else if (status.hasProfile && status.profileData) {
          // إذا كان له profile لكن غير مكتمل، املأ النموذج بالبيانات الموجودة
          this.profileForm.patchValue(status.profileData);
          this.successMessage = 'تم العثور على بياناتك المحفوظة. يمكنك تعديلها وإكمالها.';
        }
        // إذا لم يكن له profile أصلاً، اترك النموذج فارغ
      },
      error: (error) => {
        console.error('Error checking profile status:', error);
        // في حالة الخطأ، اترك النموذج يظهر عادي
      }
    });
  }

  onSubmit(): void {
    console.log('Form submission started');
    console.log('Form valid:', this.profileForm.valid);
    console.log('Form value:', this.profileForm.value);
    console.log('isSubmitting before:', this.isSubmitting);

    // إعادة تعيين الرسائل
    this.errorMessage = '';
    this.successMessage = '';

    if (this.profileForm.invalid) {
      this.markFormGroupTouched();
      this.errorMessage = 'يرجى ملء جميع الحقول المطلوبة بشكل صحيح.';
      return;
    }

    // تعيين حالة الإرسال
    this.isSubmitting = true;
    console.log('isSubmitting after:', this.isSubmitting);

    const profileData = {
      storeName: this.profileForm.value.storeName.trim(),
      businessType: this.profileForm.value.businessType.trim(),
      description: this.profileForm.value.description.trim(),
      phoneNumber: this.profileForm.value.phoneNumber.trim(),
      address: this.profileForm.value.address.trim(),
      websiteUrl: this.profileForm.value.websiteUrl?.trim() || null,
      storeLogoUrl: this.profileForm.value.storeLogoUrl?.trim() || null,
    };

    console.log('Sending profile data:', profileData);

    this.sellerService.completeProfile(profileData).subscribe({
      next: (response) => {
        console.log('Profile completed successfully:', response);
        this.isSubmitting = false;
        this.successMessage = 'تم إكمال ملف البائع بنجاح! مرحباً بك في منصة البيع.';

        // تأخير قبل التوجيه
        setTimeout(() => {
          // استخدام المتغير المرن
          this.router.navigate([this.redirectPath]);
        }, 1500);
      },
      error: (error: HttpErrorResponse) => {
        console.error('Profile completion error:', error);
        this.isSubmitting = false;

        if (error.status === 401) {
          this.errorMessage = 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.';
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        } else if (error.status === 403) {
          this.errorMessage = 'غير مصرح لك بإكمال ملف البائع. تأكد من تسجيل الدخول كبائع.';
        } else if (error.error?.message) {
          this.errorMessage = error.error.message;
        } else {
          this.errorMessage = 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.';
        }
      },
    });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.profileForm.controls).forEach((key) => {
      const control = this.profileForm.get(key);
      control?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string {
    const field = this.profileForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return this.getFieldDisplayName(fieldName) + ' مطلوب';
      }
      if (field.errors['minlength']) {
        const requiredLength = field.errors['minlength'].requiredLength;
        return `${this.getFieldDisplayName(fieldName)} يجب أن يكون على الأقل ${requiredLength} أحرف`;
      }
      if (field.errors['maxlength']) {
        const maxLength = field.errors['maxlength'].requiredLength;
        return `${this.getFieldDisplayName(fieldName)} يجب أن يكون أقل من ${maxLength} حرف`;
      }
      if (field.errors['pattern']) {
        if (fieldName === 'phoneNumber') {
          return 'رقم الهاتف يجب أن يبدأ بـ 01 أو +20 أو 002 ويكون من 10-13 رقم';
        }
        if (fieldName === 'websiteUrl' || fieldName === 'storeLogoUrl') {
          return 'يرجى إدخال رابط صحيح يبدأ بـ http:// أو https://';
        }
      }
    }
    return '';
  }

  private getFieldDisplayName(fieldName: string): string {
    const displayNames: { [key: string]: string } = {
      storeName: 'اسم المتجر',
      businessType: 'نوع النشاط التجاري',
      description: 'الوصف',
      phoneNumber: 'رقم الهاتف',
      address: 'العنوان',
      websiteUrl: 'رابط الموقع الإلكتروني',
      storeLogoUrl: 'رابط شعار المتجر',
    };
    return displayNames[fieldName] || fieldName;
  }

  // دالة للعودة لصفحة تسجيل الدخول
  goToLogin(): void {
    this.router.navigate(['/']);
  }

  // دالة لمسح النموذج
  clearForm(): void {
    this.profileForm.reset();
    this.errorMessage = '';
    this.successMessage = '';
  }
}
