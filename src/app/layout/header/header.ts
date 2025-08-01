import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { Auth, User } from '../../services/auth';

@Component({
  selector: 'app-header',
  imports: [RouterLink, CommonModule],

import { CartService } from '../../services/cart.service';
import { WishlistService } from '../../services/wishlist';

interface Language {
  code: string;
  label: string;
}


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
=======
  cartCount: number = 0;
  cartTotal: number = 0;
  cartItems: any[] = [];
  wishlistCount: number = 0;
  private subscription: Subscription = new Subscription();

  // Language settings
  selectedLang: Language = { code: 'en', label: 'Eng' };

  constructor(
    private cartService: CartService,
    private wishlistService: WishlistService
  ) { }

  ngOnInit(): void {
    // Subscribe to cart count
    this.subscription.add(
      this.cartService.getCartCount().subscribe(count => {
        this.cartCount = count;
      })
    );

    // Subscribe to cart total
    this.subscription.add(
      this.cartService.getCartTotal().subscribe(total => {
        this.cartTotal = total;
      })
    );

    // Subscribe to cart items
    this.subscription.add(
      this.cartService.getCartItems().subscribe(items => {
        this.cartItems = items;
      })
    );

    // Subscribe to wishlist count
    this.subscription.add(
      this.wishlistService.getWishlistCount().subscribe(count => {
        this.wishlistCount = count;
      })
    );

    // Load saved language preference from localStorage if available
    const savedLang = localStorage.getItem('selectedLanguage');
    if (savedLang) {
      try {
        this.selectedLang = JSON.parse(savedLang);
        this.applyLanguageDirection(this.selectedLang.code);
      } catch (error) {
        console.error('Error loading language from storage:', error);
      }
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  /**
   * Change the application language
   * @param code The language code (e.g., 'en', 'ar', 'fr')
   * @param label The display label for the language
   */
  changeLang(code: string, label: string): void {
    this.selectedLang = { code, label };

    // Save language preference to localStorage
    localStorage.setItem('selectedLanguage', JSON.stringify(this.selectedLang));

    // Apply RTL/LTR direction based on language
    this.applyLanguageDirection(code);
  }

  /**
   * Apply the appropriate text direction based on language
   * @param langCode The language code
   */
  private applyLanguageDirection(langCode: string): void {
    const htmlElement = document.querySelector('html');
    if (htmlElement) {
      // Set language attribute
      htmlElement.setAttribute('lang', langCode);

      // Set direction attribute (RTL for Arabic, LTR for others)
      if (langCode === 'ar') {
        htmlElement.setAttribute('dir', 'rtl');
        document.body.classList.add('rtl-layout');
        document.body.classList.remove('ltr-layout');
      } else {
        htmlElement.setAttribute('dir', 'ltr');
        document.body.classList.add('ltr-layout');
        document.body.classList.remove('rtl-layout');
      }
    }
  }
}
