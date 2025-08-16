import { Component, OnInit, OnDestroy,ViewChild,ElementRef,AfterViewInit } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { Auth, User } from '../../services/auth';
import { CartService } from '../../services/cart.service';
import { WishlistService } from '../../services/wishlistService';
import { ICartItem } from '../../models/i-cart-item';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { UnifiedNotificationService } from '../../services/unified-notification.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
interface Language {
  code: string;
  label: string;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, CommonModule,FormsModule],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header implements OnInit, OnDestroy,AfterViewInit {
  // User state
  currentUser: User | null = null;

  // Cart and wishlist state
  cartCount: number = 0;
  cartTotal: number = 0;
  cartItems: ICartItem[] = [];
  wishlistCount: number = 0;

  // Language settings
  selectedLang: Language = { code: 'en', label: 'Eng' };
@ViewChild('searchInput', { static: false }) searchInput!: ElementRef;
  searchQuery: string = '';
  searchSuggestions: string[] = [];
  private hideTimeout: any;

  // Notification state
  notifications: any[] = [];
  notificationCount: number = 0;
  showNotifications: boolean = false;

  // Subscriptions management
  private subscriptions: Subscription = new Subscription();
// search
searchSubject = new Subject<string>();
showSuggestions = false;

  constructor(
    private authService: Auth,
    private router: Router,
    private cartService: CartService,
    private wishlistService: WishlistService,
    private http: HttpClient,
    private unifiedNotificationService: UnifiedNotificationService
  ) { }
  ngAfterViewInit() {
    console.log('searchInput initialized:', this.searchInput); // تتبع
  }

  ngOnInit(): void {
    // Subscribe to user state
    this.subscriptions.add(
      this.authService.currentUser$.subscribe(user => {
        this.currentUser = user;
      })
    );

    // Subscribe to cart and wishlist state
    this.subscriptions.add(
      this.cartService.getCartCount().subscribe(count => {
        this.cartCount = count;
      })
    );

    this.subscriptions.add(
      this.cartService.getCartTotal().subscribe(total => {
        this.cartTotal = total;
      })
    );

    this.subscriptions.add(
      this.cartService.getCartItems().subscribe(items => {
        this.cartItems = items;
      })
    );

    this.wishlistService.getWishlistObservable().subscribe(products => {
      this.wishlistCount = products.length;
    });

    // Subscribe to notifications
    this.subscriptions.add(
      this.unifiedNotificationService.allNotifications$.subscribe(notifications => {
        this.notifications = notifications;
        this.notificationCount = notifications.filter(n => !n.isRead).length;
      })
    );

    // Load saved language preference
    this.loadSavedLanguage();
// search start =>
     this.subscriptions.add(
    this.searchSubject
      .pipe(
        debounceTime(300), // ينتظر 300ms بعد آخر حرف
        distinctUntilChanged() // يتأكد إن النص فعلاً اتغير
      )
      .subscribe(query => {
        if (query.length >= 2) {
          this.getSearchSuggestions(query);
        } else {
          this.searchSuggestions = [];
        }
      })
  );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  // Authentication methods
  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  // Navigation methods
  navigateToRegister(): void {
    this.router.navigate(['/register-selection']);
  }

  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }

  // Language management methods
  changeLang(code: string, label: string): void {
    this.selectedLang = { code, label };
    localStorage.setItem('selectedLanguage', JSON.stringify(this.selectedLang));
    this.applyLanguageDirection(code);
  }

  private loadSavedLanguage(): void {
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

  private applyLanguageDirection(langCode: string): void {
    const htmlElement = document.querySelector('html');
    if (htmlElement) {
      htmlElement.setAttribute('lang', langCode);
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

  // Search methods
private getSearchSuggestions(query: string): void {
    this.http
      .get<string[]>(`https://localhost:7253/api/product/search?q=${encodeURIComponent(query)}`)
      .subscribe({
        next: (data) => {
          console.log('API Response:', data);
          this.searchSuggestions = Array.isArray(data) ? data : [];
          this.showSuggestions = this.searchSuggestions.length > 0;
          console.log('searchSuggestions length:', this.searchSuggestions.length, 'showSuggestions:', this.showSuggestions);
        },
        error: (error) => {
          console.error('Search error:', error);
          this.searchSuggestions = [];
          this.showSuggestions = false;
        }
      });
  }





onSearchInput(): void {
    console.log('onSearchInput triggered, searchQuery:', this.searchQuery);
    this.showSuggestions = true;
    console.log('showSuggestions set to true in onSearchInput');
    this.searchSubject.next(this.searchQuery);
  }

  hideSuggestionsWithDelay() {
    console.log('Hiding suggestions...');
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout); // إلغاء الـ timeout السابق
    }
    this.hideTimeout = setTimeout(() => {
      this.showSuggestions = false;
      console.log('showSuggestions set to false after delay');
    }, 5000); // 2 ثانية
  }

  onDropdownMouseEnter() {
    this.showSuggestions = true;
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout); // إلغاء الخفاء لما تدخلي فوق الـ dropdown
    }
    console.log('Mouse entered dropdown, showSuggestions set to true');
}

onDropdownMouseLeave() {
  console.log('Mouse left dropdown, scheduling hide...');
  this.hideSuggestionsWithDelay();
}
selectSuggestion(suggestion: string) {
  this.searchQuery = suggestion;
  this.showSuggestions = false;
}

  performSearch(): void {
    if (this.searchQuery) {
      this.router.navigate(['/products'], { queryParams: { q: this.searchQuery } });
    }
  }


  // Notification methods
  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
  }

  markAllAsRead(): void {
    this.unifiedNotificationService.markAllAsRead();
  }

  onNotificationClick(notification: any): void {
    if (notification.actionUrl) {
      this.router.navigate([notification.actionUrl]);
    }
    if (!notification.isRead) {
      this.unifiedNotificationService.markAsRead(notification.id);
    }
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'product_created':
      case 'product_updated':
      case 'product_approved':
      case 'product_rejected':
      case 'product_deleted':
        return '🛍️';
      case 'order_created':
      case 'order_updated':
      case 'order_deleted':
      case 'order_status_changed':
        return '📦';
      case 'supplier_created':
      case 'supplier_updated':
      case 'supplier_deleted':
        return '🏭';
      default:
        return '📢';
    }
  }

  getNotificationColorClass(type: string): string {
    switch (type) {
      case 'product_created':
      case 'product_updated':
      case 'product_approved':
        return 'text-green-500';
      case 'product_rejected':
      case 'product_deleted':
        return 'text-red-500';
      case 'order_created':
      case 'order_updated':
      case 'order_status_changed':
        return 'text-blue-500';
      case 'order_deleted':
        return 'text-red-500';
      case 'supplier_created':
      case 'supplier_updated':
        return 'text-orange-500';
      case 'supplier_deleted':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  }

  formatTime(timestamp: Date): string {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) {
      return `${minutes} minutes ago`;
    } else if (hours < 24) {
      return `${hours} hours ago`;
    } else {
      return `${days} days ago`;
    }
  }
}
