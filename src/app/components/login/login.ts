import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Auth, User } from '../../services/auth';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-login',
  imports: [FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit, OnDestroy {
  loginForm: FormGroup;
  errorMessage: string = '';
  isSubmitting: boolean = false;
  showPassword: boolean = false;
  registrationSuccess: boolean = false;

  private subscription: Subscription = new Subscription();

  constructor(
    private fb: FormBuilder,
    private authService: Auth,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  ngOnInit() {
    // التحقق من وجود المستخدم مسجل دخول بالفعل
    if (this.authService.isLoggedIn()) {
      this.redirectBasedOnRole();
      return;
    }

    // استلام المعاملات من الـ URL
    this.subscription.add(
      this.route.queryParams.subscribe(params => {
        // التحقق من رسالة نجاح التسجيل
        if (params['message'] === 'registration_success') {
          this.registrationSuccess = true;
          setTimeout(() => {
            this.registrationSuccess = false;
          }, 5000);
        }

        // تعبئة البريد الإلكتروني إذا تم تمريره
        if (params['email']) {
          this.loginForm.patchValue({
            email: params['email']
          });
        }

        // معالجة رسائل خطأ محددة
        if (params['error']) {
          switch (params['error']) {
            case 'session_expired':
              this.errorMessage = 'انتهت صلاحية جلستك، يرجى تسجيل الدخول مرة أخرى.';
              break;
            case 'unauthorized':
              this.errorMessage = 'يجب تسجيل الدخول للوصول إلى هذه الصفحة.';
              break;
            default:
              this.errorMessage = 'حدث خطأ، يرجى تسجيل الدخول.';
          }
        }
      })
    );

    // مراقبة تغييرات النموذج لإزالة رسائل الخطأ
    this.subscription.add(
      this.loginForm.valueChanges.subscribe(() => {
        if (this.errorMessage) {
          this.errorMessage = '';
        }
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  onSubmit() {
    console.log('Login submit clicked');
    console.log('Form valid:', this.loginForm.valid);
    console.log('Form value:', this.loginForm.value);

    // إزالة الرسائل السابقة
    this.errorMessage = '';
    this.registrationSuccess = false;

    if (this.loginForm.invalid) {
      this.markFormGroupTouched();
      this.errorMessage = 'يرجى ملء جميع الحقول بشكل صحيح.';
      return;
    }

    this.isSubmitting = true;

    const loginData = {
      email: this.loginForm.value.email.trim().toLowerCase(),
      password: this.loginForm.value.password,
    };

    console.log('Sending login data:', { email: loginData.email });

    this.subscription.add(
      this.authService.login(loginData).subscribe({
        next: (response: User) => {
          console.log('Login successful:', response);
          this.isSubmitting = false;

          // حفظ خيار "تذكرني" إذا تم اختياره
          if (this.loginForm.value.rememberMe) {
            localStorage.setItem('rememberMe', 'true');
          }

          // توجيه المستخدم بناءً على دوره
          this.redirectBasedOnRole();
        },
        error: (error) => {
          console.error('Login error:', error);
          this.isSubmitting = false;

          // معالجة محسّنة للأخطاء
          if (error.message) {
            if (error.message.includes('بيانات تسجيل الدخول غير صحيحة') ||
                error.message.includes('Unauthorized')) {
              this.errorMessage = 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
              // تسليط الضوء على الحقول
              this.loginForm.get('email')?.setErrors({ 'incorrect': true });
              this.loginForm.get('password')?.setErrors({ 'incorrect': true });
            } else if (error.message.includes('لا يمكن الاتصال بالخادم')) {
              this.errorMessage = 'لا يمكن الاتصال بالخادم. تحقق من اتصالك بالإنترنت.';
            } else {
              this.errorMessage = error.message;
            }
          } else {
            this.errorMessage = 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.';
          }

          // هز النموذج للتأكيد على الخطأ
          this.shakeForm();
        },
      })
    );
  }

  // توجيه المستخدم بناءً على دوره
  private redirectBasedOnRole() {
    const currentUser = this.authService.getCurrentUser();

    if (!currentUser) {
      console.error('No current user found after login');
      return;
    }

    console.log('Redirecting user with roles:', currentUser.roles);

    // توجيه بناءً على الدور
    if (currentUser.roles.includes('Admin')) {
      this.router.navigate(['/admin/dashboard']);
    } else if (currentUser.roles.includes('Seller')) {
      this.router.navigate(['/seller/dashboard']);
    } else if (currentUser.roles.includes('PendingSeller')) {
      this.router.navigate(['/pending-seller']);
    } else if (currentUser.roles.includes('Customer')) {
      this.router.navigate(['/customer/dashboard']);
    } else {
      // fallback للمستخدمين بدون أدوار محددة
      this.router.navigate(['/dashboard']);
    }
  }

  // تبديل عرض كلمة المرور
  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  // تعليم جميع الحقول كما لو تم لمسها لإظهار رسائل الخطأ
  private markFormGroupTouched() {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  // وظيفة للحصول على رسائل الخطأ المحسّنة
  getFieldError(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return this.getFieldDisplayName(fieldName) + ' مطلوب';
      }
      if (field.errors['email']) {
        return 'البريد الإلكتروني غير صحيح';
      }
      if (field.errors['minlength']) {
        const requiredLength = field.errors['minlength'].requiredLength;
        return `${this.getFieldDisplayName(fieldName)} يجب أن يكون على الأقل ${requiredLength} أحرف`;
      }
      if (field.errors['incorrect']) {
        return fieldName === 'email' ? 'البريد الإلكتروني غير صحيح' : 'كلمة المرور غير صحيحة';
      }
    }
    return '';
  }

  private getFieldDisplayName(fieldName: string): string {
    const displayNames: { [key: string]: string } = {
      'email': 'البريد الإلكتروني',
      'password': 'كلمة المرور'
    };
    return displayNames[fieldName] || fieldName;
  }

  // تأثير الهز للنموذج عند حدوث خطأ
  private shakeForm() {
    const formElement = document.querySelector('.form-container');
    if (formElement) {
      formElement.classList.add('shake');
      setTimeout(() => {
        formElement.classList.remove('shake');
      }, 500);
    }
  }

  // مسح النموذج
  clearForm() {
    this.loginForm.reset();
    this.errorMessage = '';
    this.registrationSuccess = false;
  }

  // تسجيل الدخول كضيف (اختياري)
  loginAsGuest() {
    this.router.navigate(['/guest']);
  }

  // وظائف إضافية للتحسين

  // التحقق من صحة البريد الإلكتروني أثناء الكتابة
  onEmailBlur() {
    const emailControl = this.loginForm.get('email');
    if (emailControl && emailControl.valid && emailControl.value) {
      // يمكن إضافة فحص للتحقق من وجود البريد الإلكتروني
      console.log('Email is valid:', emailControl.value);
    }
  }

  // التقاط Enter في حقل كلمة المرور
  onKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && this.loginForm.valid) {
      this.onSubmit();
    }
  }

  // التحقق من قوة الاتصال بالخادم
  async checkServerConnection(): Promise<boolean> {
    try {
      // يمكن إضافة استدعاء ping للخادم هنا
      return true;
    } catch (error) {
      console.error('Server connection failed:', error);
      return false;
    }
  }

  // معالجة حفظ بيانات تسجيل الدخول للمستقبل
  saveLoginAttempt() {
    const email = this.loginForm.get('email')?.value;
    if (email && this.loginForm.get('email')?.valid) {
      localStorage.setItem('lastLoginEmail', email);
    }
  }

  // استرجاع آخر بريد إلكتروني تم استخدامه
  loadLastLoginEmail() {
    const lastEmail = localStorage.getItem('lastLoginEmail');
    if (lastEmail) {
      this.loginForm.patchValue({ email: lastEmail });
    }
  }

  // تنظيف البيانات المحفوظة
  clearSavedData() {
    localStorage.removeItem('lastLoginEmail');
    localStorage.removeItem('rememberMe');
  }
}
