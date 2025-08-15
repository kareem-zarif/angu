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
import { UnifiedNotificationService } from '../../services/unified-notification.service';
import { AddressService } from '../../services/address.service';
import { IAddress } from '../../models/iaddress';

interface Language {
  code: string;
  label: string;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
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

  // Notification state
  notifications: any[] = [];
  notificationCount: number = 0;
  showNotifications: boolean = false;

  // Address state
  currentAddress: IAddress | null = null;
  addressDisplay: string = 'Select Address';
  isLoadingAddress: boolean = false;

  // Subscriptions management
  private subscriptions: Subscription = new Subscription();

  constructor(
    private authService: Auth,
    private router: Router,
    private cartService: CartService,
    private wishlistService: WishlistService,
    private http: HttpClient,
    private unifiedNotificationService: UnifiedNotificationService,
    private addressService: AddressService
  ) { }

  ngOnInit(): void {
    // Subscribe to user state
    this.subscriptions.add(
      this.authService.currentUser$.subscribe((user: User | null) => {
        this.currentUser = user;
        if (user?.UserId) {
          this.loadCurrentAddress();
        } else {
          this.resetAddressState();
        }
      })
    );

    // Subscribe to cart and wishlist state
    this.subscriptions.add(
      this.cartService.getCartCount().subscribe((count: number) => {
        this.cartCount = count;
      })
    );

    this.subscriptions.add(
      this.cartService.getCartTotal().subscribe((total: number) => {
        this.cartTotal = total;
      })
    );

    this.subscriptions.add(
      this.cartService.getCartItems().subscribe((items: ICartItem[]) => {
        this.cartItems = items;
      })
    );

    this.subscriptions.add(
      this.wishlistService.getWishlistObservable().subscribe((products: any[]) => {
        this.wishlistCount = products.length;
      })
    );

    // Subscribe to notifications
    this.subscriptions.add(
      this.unifiedNotificationService.allNotifications$.subscribe((notifications: any[]) => {
        this.notifications = notifications;
        this.notificationCount = notifications.filter((n: any) => !n.isRead).length;
      })
    );

    // Load saved language preference
    this.loadSavedLanguage();
  }

  // Address management methods
  private resetAddressState(): void {
    this.currentAddress = null;
    this.addressDisplay = 'Select Address';
    this.isLoadingAddress = false;
  }

  loadCurrentAddress(): void {
    if (!this.currentUser?.UserId) {
      this.resetAddressState();
      return;
    }

    this.isLoadingAddress = true;
    console.log('Loading current address for user:', this.currentUser.UserId);
    
    // Get all addresses and use the first one (or most recently created)
    this.subscriptions.add(
      this.addressService.getAddresses(this.currentUser.UserId).subscribe({
        next: (addresses: IAddress[]) => {
          console.log('Addresses loaded:', addresses);
          if (addresses && addresses.length > 0) {
            // Use the first address, or the most recently created one if createdAt exists
            let selectedAddress = addresses[0];
            
            // If addresses have createdAt, use the most recent one
            if (addresses[0].createdAt) {
              selectedAddress = addresses.reduce((latest: IAddress, current: IAddress) => {
                if (!latest.createdAt || !current.createdAt) return latest;
                return new Date(current.createdAt) > new Date(latest.createdAt) ? current : latest;
              });
            }
            
            this.setCurrentAddress(selectedAddress);
          } else {
            this.addressDisplay = 'No address set';
          }
          this.isLoadingAddress = false;
        },
        error: (error: any) => {
          console.error('Error loading addresses:', error);
          this.addressDisplay = 'Error loading address';
          this.isLoadingAddress = false;
        }
      })
    );
  }

  private setCurrentAddress(address: IAddress): void {
    this.currentAddress = address;
    this.addressDisplay = this.getAddressDisplay(address);
  }

  getAddressDisplay(address: IAddress): string {
    if (!address) return 'Select Address';
    
    // Create a more comprehensive address display
    const parts = [];
    
    if (address.street) parts.push(address.street);
    if (address.city) parts.push(address.city);
    if (address.state) parts.push(address.state);
    
    if (parts.length === 0) {
      return 'Invalid Address';
    }
    
    // Return the last two parts (typically city, state) for header display
    return parts.slice(-2).join(', ');
  }

  navigateToAddressManagement(): void {
    if (this.isLoggedIn()) {
      this.router.navigate(['/address-management']);
    } else {
      this.router.navigate(['/login'], { 
        queryParams: { returnUrl: '/address-management' }
      });
    }
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
    this.resetAddressState();
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
        // Reset to default if parsing fails
        this.selectedLang = { code: 'en', label: 'Eng' };
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

    this.subscriptions.add(
      this.http.get<string[]>(`api/product/search?q=${encodeURIComponent(this.searchQuery)}`)
        .subscribe({
          next: (suggestions: string[]) => {
            this.searchSuggestions = suggestions || [];
          },
          error: (error: any) => {
            console.error('Search error:', error);
            this.searchSuggestions = [];
          }
        })
    );
  }

  selectSuggestion(suggestion: string): void {
    this.searchQuery = suggestion;
    this.searchSuggestions = [];
    this.performSearch();
  }

  performSearch(): void {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/products'], { 
        queryParams: { q: this.searchQuery.trim() } 
      });
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
    this.showNotifications = false; // Close notifications panel
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
    const notificationDate = new Date(timestamp);
    const diff = now.getTime() - notificationDate.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) {
      return 'Just now';
    } else if (minutes < 60) {
      return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    } else if (hours < 24) {
      return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    } else if (days < 30) {
      return `${days} day${days === 1 ? '' : 's'} ago`;
    } else {
      return notificationDate.toLocaleDateString();
    }
  }
}