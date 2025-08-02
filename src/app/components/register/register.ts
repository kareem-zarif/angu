import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Auth } from '../../services/auth';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  imports: [FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register implements OnInit {
  registerForm: FormGroup;
  selectedRole: 'Customer' | 'Seller' | null = null;
  errorMessage: string = '';
  isSubmitting: boolean = false;
  successMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private authService: Auth,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [
        Validators.required,
        Validators.pattern('^(?=.*[0-9])(?=.*[a-z]).{8,32}$')
      ]],
    });
  }

  ngOnInit() {
    // استلام الـ role من query parameters
    this.route.queryParams.subscribe(params => {
      if (params['role'] && (params['role'] === 'Customer' || params['role'] === 'Seller')) {
        this.selectedRole = params['role'];
        console.log('Selected role from params:', this.selectedRole);
      }
    });
  }

  selectRole(role: 'Customer' | 'Seller') {
    this.selectedRole = role;
  }

  // التحقق من وجود البريد الإلكتروني
  checkEmailExists() {
    const email = this.registerForm.get('email')?.value;
    if (email && this.registerForm.get('email')?.valid) {
      // يمكنك إضافة استدعاء لـ API للتحقق من البريد
      // this.authService.checkEmailExists(email).subscribe(...)
    }
  }

  onSubmit() {
    console.log('Submit clicked');
    console.log('Selected role:', this.selectedRole);
    console.log('Form valid:', this.registerForm.valid);
    console.log('Form value:', this.registerForm.value);

    // إزالة الرسائل السابقة
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.selectedRole) {
      this.errorMessage = 'يرجى اختيار نوع الحساب.';
      return;
    }

    if (this.registerForm.invalid) {
      this.markFormGroupTouched();
      this.errorMessage = 'يرجى ملء جميع الحقول بشكل صحيح.';
      return;
    }

    this.isSubmitting = true;

    const formData = {
      firstName: this.registerForm.value.firstName.trim(),
      lastName: this.registerForm.value.lastName.trim(),
      email: this.registerForm.value.email.trim().toLowerCase(),
      password: this.registerForm.value.password,
      requestedRole: this.selectedRole,
    };

    console.log('Sending data:', formData);

    this.authService.register(formData).subscribe({
      next: (response) => {
        console.log('Registration successful:', response);
        this.isSubmitting = false;

        // رسالة نجاح
        if (this.selectedRole === 'Seller') {
          this.successMessage = 'تم إنشاء حسابك بنجاح! سيتم مراجعة طلبك من قبل الإدارة قريباً.';
        } else {
          this.successMessage = 'تم إنشاء حسابك بنجاح! مرحباً بك في منصتنا.';
        }

        // تأخير قبل التوجيه
        setTimeout(() => {
          this.router.navigate(['/login'], {
            queryParams: {
              message: 'registration_success',
              email: formData.email
            }
          });
        }, 2000);
      },
      error: (error) => {
        console.error('Registration error:', error);
        this.isSubmitting = false;

        // معالجة محسّنة للأخطاء
        if (error.message) {
          if (error.message.includes('Email address is in use')) {
            this.errorMessage = 'هذا البريد الإلكتروني مستخدم بالفعل. يرجى استخدام بريد آخر أو تسجيل الدخول.';
            // تسليط الضوء على حقل البريد الإلكتروني
            this.registerForm.get('email')?.setErrors({ 'emailInUse': true });
          } else if (error.message.includes('Password')) {
            this.errorMessage = 'كلمة المرور لا تلبي المتطلبات المطلوبة.';
          } else {
            this.errorMessage = error.message;
          }
        } else {
          this.errorMessage = 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.';
        }
      },
    });
  }

  // تعليم جميع الحقول كما لو تم لمسها لإظهار رسائل الخطأ
  private markFormGroupTouched() {
    Object.keys(this.registerForm.controls).forEach(key => {
      const control = this.registerForm.get(key);
      control?.markAsTouched();
    });
  }

  // وظيفة للحصول على رسائل الخطأ المحسّنة
  getFieldError(fieldName: string): string {
    const field = this.registerForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return this.getFieldDisplayName(fieldName) + ' مطلوب';
      }
      if (field.errors['email']) {
        return 'البريد الإلكتروني غير صحيح';
      }
      if (field.errors['pattern']) {
        return 'كلمة المرور يجب أن تحتوي على رقم وحرف صغير وطول لا يقل عن 8 أحرف';
      }
      if (field.errors['minlength']) {
        const requiredLength = field.errors['minlength'].requiredLength;
        return `${this.getFieldDisplayName(fieldName)} يجب أن يكون على الأقل ${requiredLength} أحرف`;
      }
      if (field.errors['emailInUse']) {
        return 'هذا البريد الإلكتروني مستخدم بالفعل';
      }
    }
    return '';
  }

  private getFieldDisplayName(fieldName: string): string {
    const displayNames: { [key: string]: string } = {
      'firstName': 'الاسم الأول',
      'lastName': 'الاسم الأخير',
      'email': 'البريد الإلكتروني',
      'password': 'كلمة المرور'
    };
    return displayNames[fieldName] || fieldName;
  }

  // وظيفة للتنقل إلى صفحة تسجيل الدخول مع البريد المدخل
  goToLogin() {
    const email = this.registerForm.get('email')?.value;
    this.router.navigate(['/login'], {
      queryParams: email ? { email } : {}
    });
  }

  // وظيفة لمسح النموذج
  clearForm() {
    this.registerForm.reset();
    this.errorMessage = '';
    this.successMessage = '';
    this.selectedRole = null;
  }

  // التحقق من قوة كلمة المرور
  getPasswordStrength(): string {
    const password = this.registerForm.get('password')?.value || '';

    if (password.length === 0) return '';

    let strength = 0;

    // طول كلمة المرور
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;

    // تحتوي على أرقام
    if (/[0-9]/.test(password)) strength++;

    // تحتوي على أحرف صغيرة
    if (/[a-z]/.test(password)) strength++;

    // تحتوي على أحرف كبيرة
    if (/[A-Z]/.test(password)) strength++;

    // تحتوي على رموز خاصة
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    if (strength <= 2) return 'ضعيفة';
    if (strength <= 4) return 'متوسطة';
    return 'قوية';
  }

  getPasswordStrengthColor(): string {
    const strength = this.getPasswordStrength();
    switch (strength) {
      case 'ضعيفة': return 'text-red-500';
      case 'متوسطة': return 'text-yellow-500';
      case 'قوية': return 'text-green-500';
      default: return 'text-gray-500';
    }
  }
}
