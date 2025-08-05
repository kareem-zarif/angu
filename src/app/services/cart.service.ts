import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError, forkJoin } from 'rxjs';
import { catchError, map, tap, switchMap, take } from 'rxjs/operators';
import { IProduct } from '../models/i-product';
import { ICart } from '../models/i-cart';
import { ICartItem } from '../models/i-cart-item';
import { environment } from '../../environment/environment';

export interface CartCreateDto {
  customerId: string;
}

export interface CartItemCreateDto {
  productId: string;
  cartId: string;
  quantity: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private _baseUrl = `${environment.apiUrl}/Cart`;
  private _cartItemUrl = `${environment.apiUrl}/CartItem`;
  private cartKey = 'user_cart';
  private cartItems: ICartItem[] = [];
  private cartItemsSubject = new BehaviorSubject<ICartItem[]>([]);
  private cartTotalSubject = new BehaviorSubject<number>(0);
  private cartCountSubject = new BehaviorSubject<number>(0);

  constructor(private http: HttpClient) {
    this.loadCartFromStorage();
  }

  // Get API URLs for external use
  getCartApiUrl(): string {
    return this._baseUrl;
  }

  getCartItemApiUrl(): string {
    return this._cartItemUrl;
  }

  // Get cart items as observable
  getCartItems(): Observable<ICartItem[]> {
    return this.cartItemsSubject.asObservable();
  }

  // Get cart total as observable
  getCartTotal(): Observable<number> {
    return this.cartTotalSubject.asObservable();
  }

  // Get cart count as observable
  getCartCount(): Observable<number> {
    return this.cartCountSubject.asObservable();
  }

  // Add product to cart
  addToCart(product: IProduct, quantity: number = 1, customerId?: string): void {
    const existingItem = this.cartItems.find(item => item.Product.id === product.id);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      const newCartItem: Partial<ICartItem> = {
        Product: product,
        quantity: quantity
      };

      this.cartItems.push(newCartItem as ICartItem);
    }

    this.updateCart();
    this.saveCartToStorage();
    // Sync with API if user is authenticated
    if (customerId) {
      this.syncWithApi(customerId, product.id, existingItem ? existingItem.quantity : quantity);
    }
  }

  // Remove product from cart
  removeFromCart(productId: string, customerId?: string): void {
    this.cartItems = this.cartItems.filter(item => item.Product.id !== productId);
    this.updateCart();

    // Sync with API if user is authenticated
    if (customerId) {
      this.removeFromApi(customerId, productId);
    }
  }

  // Update product quantity
  updateQuantity(productId: string, quantity: number, customerId?: string): void {
    const item = this.cartItems.find(item => item.Product.id === productId);

    if (item) {
      item.quantity = quantity;

      if (quantity <= 0) {
        this.removeFromCart(productId, customerId);
      } else {
        this.updateCart();

        // Sync with API if user is authenticated
        if (customerId) {
          this.syncWithApi(customerId, productId, quantity);
        }
      }
    }
  }

  // Clear cart
  clearCart(): void {
    this.cartItems = [];
    this.updateCart();
  }

  // Calculate product price based on quantity
  calculateItemPrice(item: ICartItem): number {
    const { Product: product, quantity } = item;

    if (quantity >= 100 && product.pricePer100Piece) {
      return product.pricePer100Piece * quantity;
    } else if (quantity >= 50 && product.pricePer50Piece) {
      return product.pricePer50Piece * quantity;
    } else {
      return (product.pricePerPiece || 0) * quantity;
    }
  }

  // Calculate total cart price
  calculateTotal(): number {
    return this.cartItems.reduce((total, item) => {
      return total + this.calculateItemPrice(item);
    }, 0);
  }

  // Refresh cart from API
  refreshCart(customerId?: string): void {
    if (!customerId) {
      return;
    }

    this.getCartFromApi(customerId).subscribe({
      next: (cart) => {
        if (cart && cart.cartItems) {
          // Convert API cart items to local format
          const cartItems: ICartItem[] = [];

          // We need to fetch product details for each cart item
          const productFetchPromises = cart.cartItems.map(item => {
            return this.http.get<IProduct>(`${environment.apiUrl}/Product/${item.id}`).pipe(
              catchError(error => {
                console.error(`Error fetching product ${item.id}:`, error);
                return of(null);
              })
            );
          });

          forkJoin(productFetchPromises).subscribe({
            next: (products) => {
              // Filter out null products and create cart items
              products.filter(p => p !== null).forEach((product, index) => {
                if (product) {
                  const newCartItem: Partial<ICartItem> = {
                    Product: product,
                  };

                  this.cartItems.push(newCartItem as ICartItem);
                }
              });

              if (cartItems.length > 0) {
                this.cartItems = cartItems;
                this.updateCart();
              }
            },
            error: (error) => {
              console.error('Error fetching products for cart:', error);
            }
          });
        }
      },
      error: (error) => {
        console.error('Error refreshing cart:', error);
      }
    });
  }

  // Private methods
  private updateCart(): void {
    this.cartItemsSubject.next([...this.cartItems]);
    this.cartTotalSubject.next(this.calculateTotal());
    this.cartCountSubject.next(this.calculateCount());
    this.saveCartToStorage();
  }

  private calculateCount(): number {
    return this.cartItems.reduce((count, item) => count + item.quantity, 0);
  }

  private saveCartToStorage(): void {
    localStorage.setItem(this.cartKey, JSON.stringify(this.cartItems));
  }

  private loadCartFromStorage(): void {
    const storedCart = localStorage.getItem(this.cartKey);

    if (storedCart) {
      try {
        this.cartItems = JSON.parse(storedCart);
        this.updateCart();
      } catch (error) {
        console.error('Error loading cart from storage:', error);
        this.cartItems = [];
        this.updateCart();
      }
    }
  }

  private getCartFromApi(customerId: string): Observable<ICart> {
    return this.http.get<ICart>(`${this._baseUrl}/${customerId}`).pipe(
      catchError(error => {
        console.error('Error fetching cart from API:', error);
        // Return empty cart as fallback
        return of({
          id: customerId,
          customerId: customerId,
          cartItems: []
        });
      })
    );
  }

  private syncWithApi(customerId: string, productId: string, quantity: number): void {
    // Check if cart exists for this customer
    this.http.get<ICart>(`${this._baseUrl}/${customerId}`).pipe(
      catchError(error => {
        if (error.status === 404) {
          // Cart doesn't exist, create it
          const cartDto: CartCreateDto = { customerId };
          return this.http.post<ICart>(`${this._baseUrl}`, cartDto);
        }
        return throwError(() => error);
      }),
      switchMap((cart) => {
        // Check if item already exists in cart
        return this.http.get<ICartItem[]>(`${this._cartItemUrl}/cart/${cart.id}`).pipe(
          catchError(error => {
            console.error(`Error fetching cart items for cart ${cart.id}:`, error);
            return of([]);
          }),
          switchMap((cartItems) => {
            const existingItem = cartItems.find(item => item.id === productId);

            if (existingItem) {
              // Update existing item
              return this.http.put(`${this._cartItemUrl}/${existingItem.id}`, {
                ...existingItem,
                quantity: quantity
              });
            } else {
              // Add new item to cart
              const cartItemDto: CartItemCreateDto = {
                productId: productId,
                cartId: cart.id,
                quantity: quantity
              };

              return this.http.post(`${this._cartItemUrl}`, cartItemDto);
            }
          })
        );
      })
    ).subscribe({
      next: () => console.log('Cart synced with API'),
      error: (err) => console.error('Error syncing cart with API:', err)
    });
  }

  private removeFromApi(customerId: string, productId: string): void {
    // Check if cart exists for this customer
    this.http.get<ICart>(`${this._baseUrl}/${customerId}`).pipe(
      catchError(error => {
        if (error.status === 404) {
          // Cart doesn't exist, nothing to remove
          return throwError(() => error);
        }
        return throwError(() => error);
      }),
      switchMap((cart) => {
        // Check if item exists in cart
        return this.http.get<ICartItem[]>(`${this._cartItemUrl}/cart/${cart.id}`).pipe(
          catchError(error => {
            console.error(`Error fetching cart items for cart ${cart.id}:`, error);
            return of([]);
          }),
          switchMap((cartItems) => {
            const existingItem = cartItems.find(item => item.id === productId);

            if (existingItem) {
              // Remove item from cart
              return this.http.delete(`${this._cartItemUrl}/${existingItem.id}`);
            } else {
              // Item doesn't exist in cart
              return of(null);
            }
          })
        );
      })
    ).subscribe({
      next: () => console.log('Item removed from cart in API'),
      error: (err) => console.error('Error removing item from cart in API:', err)
    });
  }

  syncLocalCartWithApi(customerId: string): Observable<any> {
    const localCart = this.cartItems;

    // First create or get cart
    return this.http.get<ICart>(`${this._baseUrl}/${customerId}`).pipe(
      catchError(error => {
        if (error.status === 404) {
          // Create new cart if it doesn't exist
          return this.http.post<ICart>(this._baseUrl, { customerId });
        }
        return throwError(() => error);
      }),
      switchMap(cart => {
        if (localCart.length === 0) {
          return of(null);
        }

        // Create observables for each cart item
        const itemObservables = localCart.map(item => {
          const cartItemDto: CartItemCreateDto = {
            productId: item.Product.id,
            cartId: cart.id,
            quantity: item.quantity
          };

          return this.http.post(`${this._cartItemUrl}`, cartItemDto).pipe(
            catchError(error => {
              console.error('Error adding item to cart:', error);
              return of(null);
            })
          );
        });

        // Execute all requests
        return forkJoin(itemObservables);
      }),
      tap(() => {
        console.log('Cart synced with API');
        // Clear local storage after successful sync
        this.loadCartFromApi(customerId);
      })
    );
  }

  private loadCartFromApi(customerId: string): void {
    this.http.get<ICart>(`${this._baseUrl}/${customerId}`).subscribe({
      next: (cart) => {
        if (cart && cart.cartItems) {
          this.cartItems = cart.cartItems;
          this.updateCart();
        }
      },
      error: (error) => console.error('Error loading cart from API:', error)
    });
  }
}
