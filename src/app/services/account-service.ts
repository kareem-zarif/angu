import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError, forkJoin } from 'rxjs';
import { catchError, map, tap, switchMap, take } from 'rxjs/operators';
import { WishlistService } from './wishlist';
import { CartService } from './cart.service';

// This interface will be used by the authentication team
export interface CustomerCreateDto {
  firstName: string;
  lastName: string;
  phone: string;
}

// This interface will be used by the authentication team
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  isAuthenticated: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private _baseUrl = 'https://localhost:7777/api/Customer';
  private userKey = 'current_user';
  private currentUserSubject = new BehaviorSubject<User | null>(null);

  constructor(
    private http: HttpClient,
    private wishlistService: WishlistService,
    private cartService: CartService
  ) {
    // Load user from local storage on service initialization
    this.loadUserFromStorage();
  }

  // Get current user as observable
  getCurrentUser(): Observable<User | null> {
    return this.currentUserSubject.asObservable();
  }

  // Get current user value
  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  // Check if user is authenticated
  get isAuthenticated(): boolean {
    return !!this.currentUserSubject.value?.isAuthenticated;
  }

  // Private methods
  private loadUserFromStorage(): void {
    const storedUser = localStorage.getItem(this.userKey);

    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        this.currentUserSubject.next(user);
      } catch (error) {
        console.error('Error parsing user from local storage:', error);
        this.currentUserSubject.next(null);
      }
    }
  }

  // =====================================================================
  // The following methods will be implemented by the authentication team
  // =====================================================================

  // Register a new user
  // This method will be implemented by the authentication team
  // It should:
  // 1. Send a POST request to ${this._baseUrl} with the customerDto
  // 2. Save the user to local storage
  // 3. Transfer local storage data to backend using transferLocalDataToBackend(user.id)

  // Login user
  // This method will be implemented by the authentication team
  // It should:
  // 1. Send a POST request to ${this._baseUrl}/login with the loginRequest
  // 2. Save the user to local storage
  // 3. Transfer local storage data to backend using transferLocalDataToBackend(user.id)

  // Logout user
  // This method will be implemented by the authentication team
  // It should:
  // 1. Remove user from local storage
  // 2. Update current user subject to null

  // =====================================================================
  // Data transfer methods - These will be used by the authentication team
  // =====================================================================

  // Transfer local storage data to backend
  transferLocalDataToBackend(customerId: string): void {
    // Transfer wishlist data
    this.transferWishlistData(customerId);

    // Transfer cart data
    this.transferCartData(customerId);
  }

  // Transfer wishlist data to backend
  private transferWishlistData(customerId: string): void {
    // Create wishlist for the customer
    const wishlistCreateDto = { customerId };

    // Get local wishlist items
    const localWishlistItems = this.wishlistService.getWishlist();

    if (localWishlistItems.length === 0) {
      return; // No wishlist items to transfer
    }

    // Check if wishlist exists for this customer
    this.http.get(`${this.wishlistService.getWishlistApiUrl()}/${customerId}`).pipe(
      catchError(error => {
        if (error.status === 404) {
          // Wishlist doesn't exist, create it
          return this.http.post(this.wishlistService.getWishlistApiUrl(), wishlistCreateDto);
        }
        return throwError(() => error);
      }),
      switchMap((wishlist: any) => {
        // Add each product to the wishlist
        const productAddPromises = localWishlistItems.map(product => {
          return this.http.post(`${this.wishlistService.getProductWishlistApiUrl()}`, {
            productId: product.id,
            wishListId: wishlist.id
          }).pipe(
            catchError(error => {
              console.error(`Error adding product ${product.id} to wishlist:`, error);
              return of(null); // Continue with other products even if one fails
            })
          );
        });

        return forkJoin(productAddPromises);
      })
    ).subscribe({
      next: () => {
        console.log('Wishlist data transferred to backend successfully');
        // Refresh wishlist from API to ensure it's in sync
        this.wishlistService.refreshWishlist(customerId);
      },
      error: (error) => {
        console.error('Error transferring wishlist data to backend:', error);
      }
    });
  }

  // Transfer cart data to backend
  private transferCartData(customerId: string): void {
    // Create cart for the customer
    const cartCreateDto = { customerId };

    // Get local cart items
    this.cartService.getCartItems().pipe(
      take(1)
    ).subscribe(localCartItems => {
      if (localCartItems.length === 0) {
        return; // No cart items to transfer
      }

      // Check if cart exists for this customer
      this.http.get(`${this.cartService.getCartApiUrl()}/${customerId}`).pipe(
        catchError(error => {
          if (error.status === 404) {
            // Cart doesn't exist, create it
            return this.http.post(this.cartService.getCartApiUrl(), cartCreateDto);
          }
          return throwError(() => error);
        }),
        switchMap((cart: any) => {
          // Add each item to the cart
          const cartItemAddPromises = localCartItems.map(item => {
            return this.http.post(`${this.cartService.getCartItemApiUrl()}`, {
              productId: item.product.id,
              cartId: cart.id,
              quantity: item.quantity
            }).pipe(
              catchError(error => {
                console.error(`Error adding item ${item.product.id} to cart:`, error);
                return of(null); // Continue with other items even if one fails
              })
            );
          });

          return forkJoin(cartItemAddPromises);
        })
      ).subscribe({
        next: () => {
          console.log('Cart data transferred to backend successfully');
          // Refresh cart from API to ensure it's in sync
          this.cartService.refreshCart(customerId);
        },
        error: (error) => {
          console.error('Error transferring cart data to backend:', error);
        }
      });
    });
  }

  
}

