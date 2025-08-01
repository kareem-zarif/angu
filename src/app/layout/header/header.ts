import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { Auth, User } from '../../services/auth';

@Component({
  selector: 'app-header',
  imports: [RouterLink, CommonModule],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header implements OnInit, OnDestroy {
  selectedLang = { code: 'en', label: 'Eng' };
  currentUser: User | null = null;
  private userSubscription: Subscription = new Subscription();

  constructor(
    private authService: Auth,
    private router: Router
  ) {}

  ngOnInit() {
    // الاشتراك في حالة المستخدم الحالي
    this.userSubscription = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  ngOnDestroy() {
    this.userSubscription.unsubscribe();
  }

  changeLang(code: string, label: string) {
    this.selectedLang = { code, label };
    // لو بتستخدم ngx-translate أو أي مكتبة ترجمة:
    // this.translate.use(code);
  }

  // التنقل إلى صفحة اختيار نوع التسجيل
  navigateToRegister() {
    this.router.navigate(['/register-selection']);
  }
  navigateToLogin() {
    this.router.navigate(['/login']);
  }

  // تسجيل الخروج
  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  // التحقق من تسجيل الدخول
  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }
}
