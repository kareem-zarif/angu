import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CartService } from '../../services/cart.service';
import { Subscription } from 'rxjs';

interface Language {
  code: string;
  label: string;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header implements OnInit, OnDestroy {
  cartCount: number = 0;
  cartTotal: number = 0;
  cartItems: any[] = [];
  private subscription: Subscription = new Subscription();

  // Language settings
  selectedLang: Language = { code: 'en', label: 'Eng' };

  constructor(private cartService: CartService) { }

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
