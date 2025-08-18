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
import { Subscription, Subject } from 'rxjs';
import { filter, take, takeUntil } from 'rxjs/operators';

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
  private destroy$ = new Subject<void>(); // used to clean auth subscription

  constructor(
    private fb: FormBuilder,
    private authService: Auth,
    private router: Router,
    private route: ActivatedRoute,
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false],
    });
  }

  ngOnInit() {
    // اشتراك في currentUser$ لنتعامل مع حالة الدخول reactively
    // إذا كان هناك مستخدم فعلًا نعمل redirect تلقائيًا
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        if (user) {
          // لو المستخدم موجود (مسجّل دخول) نوجهه فورًا
          this.redirectBasedOnRole();
        }
      });

    // قراءة query params (registration success / prefill email / error)
    this.subscription.add(
      this.route.queryParams.subscribe((params) => {
        if (params['message'] === 'registration_success') {
          this.registrationSuccess = true;
          setTimeout(() => {
            this.registrationSuccess = false;
          }, 5000);
        }

        if (params['email']) {
          this.loginForm.patchValue({
            email: params['email'],
          });
        }

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

    // Clear errorMessage on form changes
    this.subscription.add(
      this.loginForm.valueChanges.subscribe(() => {
        if (this.errorMessage) {
          this.errorMessage = '';
        }
      })
    );
  }

  ngOnDestroy() {
    // تنظيف subscription التقليدي والاشتراك في auth
    this.subscription.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSubmit() {
    console.log('Login submit clicked');

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

    this.subscription.add(
      this.authService.login(loginData).subscribe({
        next: (response: User) => {
          console.log('Login successful:', response);
          this.isSubmitting = false;

          // لا نحتاج لاستدعاء setCurrentUser هنا لأن Auth.login يقوم بذلك
          if (this.loginForm.value.rememberMe) {
            localStorage.setItem('rememberMe', 'true');
          }

          // ننتظر اصدار قيمة currentUser مرة واحدة ثم نوجّه المستخدم
          this.authService.currentUser$
            .pipe(filter(u => !!u), take(1))
            .subscribe(() => this.redirectBasedOnRole());
        },
        error: (error) => {
          console.error('Login error:', error);
          this.isSubmitting = false;

          if (error.message) {
            if (
              error.message.includes('بيانات تسجيل الدخول غير صحيحة') ||
              error.message.includes('Unauthorized')
            ) {
              this.errorMessage = 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
              this.loginForm.get('email')?.setErrors({ incorrect: true });
              this.loginForm.get('password')?.setErrors({ incorrect: true });
            } else if (error.message.includes('لا يمكن الاتصال بالخادم')) {
              this.errorMessage = 'لا يمكن الاتصال بالخادم. تحقق من اتصالك بالإنترنت.';
            } else {
              this.errorMessage = error.message;
            }
          } else {
            this.errorMessage = 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.';
          }

          this.shakeForm();
        },
      })
    );
  }

  private redirectBasedOnRole() {
    const currentUser = this.authService.getCurrentUser();

    if (!currentUser) {
      console.error('No current user found after login');
      return;
    }

    console.log('Redirecting user with roles:', currentUser.roles);

    if (currentUser.roles.includes('Admin')) {
      this.router.navigate(['/admin']);
    } else if (currentUser.roles.includes('Seller')) {
      this.router.navigate(['/seller/dashboard']);
    } else if (currentUser.roles.includes('Customer')) {
      this.router.navigate(['/products']);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  private markFormGroupTouched() {
    Object.keys(this.loginForm.controls).forEach((key) => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

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
      email: 'البريد الإلكتروني',
      password: 'كلمة المرور',
    };
    return displayNames[fieldName] || fieldName;
  }

  private shakeForm() {
    const formElement = document.querySelector('.form-container');
    if (formElement) {
      formElement.classList.add('shake');
      setTimeout(() => {
        formElement.classList.remove('shake');
      }, 500);
    }
  }

  clearForm() {
    this.loginForm.reset();
    this.errorMessage = '';
    this.registrationSuccess = false;
  }

  loginAsGuest() {
    this.router.navigate(['/guest']);
  }

  onEmailBlur() {
    const emailControl = this.loginForm.get('email');
    if (emailControl && emailControl.valid && emailControl.value) {
      console.log('Email is valid:', emailControl.value);
    }
  }

  onKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && this.loginForm.valid) {
      this.onSubmit();
    }
  }

  async checkServerConnection(): Promise<boolean> {
    try {
      return true;
    } catch (error) {
      console.error('Server connection failed:', error);
      return false;
    }
  }

  saveLoginAttempt() {
    const email = this.loginForm.get('email')?.value;
    if (email && this.loginForm.get('email')?.valid) {
      localStorage.setItem('lastLoginEmail', email);
    }
  }

  loadLastLoginEmail() {
    const lastEmail = localStorage.getItem('lastLoginEmail');
    if (lastEmail) {
      this.loginForm.patchValue({ email: lastEmail });
    }
  }

  clearSavedData() {
    localStorage.removeItem('lastLoginEmail');
    localStorage.removeItem('rememberMe');
  }
}
