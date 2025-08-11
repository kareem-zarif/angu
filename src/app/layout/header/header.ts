import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { Auth, User } from '../../services/auth';
import { CartService } from '../../services/cart.service';
import { WishlistService } from '../../services/wishlistService';
import { ICartItem } from '../../models/i-cart-item';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

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
export class Header implements OnInit, OnDestroy {
  // User state
  currentUser: User | null = null;

  // Cart and wishlist state
  cartCount: number = 0;
  cartTotal: number = 0;
  cartItems: ICartItem[] = [];
  wishlistCount: number = 0;

  // Language settings
  selectedLang: Language = { code: 'en', label: 'Eng' };

  searchQuery: string = '';
  searchSuggestions: string[] = [];

  // Subscriptions management
  private subscriptions: Subscription = new Subscription();

  constructor(
    private authService: Auth,
    private router: Router,
    private cartService: CartService,
    private wishlistService: WishlistService,
    private http: HttpClient
  ) { }

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


    // Load saved language preference
    this.loadSavedLanguage();
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
  onSearchInput(): void {
    if (this.searchQuery.length < 2) {
      this.searchSuggestions = [];
      return;
    }

    this.http.get<string[]>(`api/product/search?q=${encodeURIComponent(this.searchQuery)}`)
      .subscribe({
        next: (suggestions) => {
          this.searchSuggestions = suggestions;
        },
        error: (error) => {
          console.error('Search error:', error);
          this.searchSuggestions = [];
        }
      });
  }

  selectSuggestion(suggestion: string): void {
    this.searchQuery = suggestion;
    this.searchSuggestions = [];
    this.performSearch();
  }

  performSearch(): void {
    if (this.searchQuery) {
      this.router.navigate(['/products'], { queryParams: { q: this.searchQuery } });
    }
  }

}
