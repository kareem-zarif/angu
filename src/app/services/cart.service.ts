import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError, forkJoin } from 'rxjs';
import { catchError, filter, map, shareReplay, switchMap, take, tap } from 'rxjs/operators';
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

@Injectable({ providedIn: 'root' })
export class CartService {
  private _baseUrl = `${environment.apiUrl}/Cart`;
  private _cartItemUrl = `${environment.apiUrl}/CartItem`;
  private cartKey = 'user_cart';

  private cartItemsSubject = new BehaviorSubject<ICartItem[]>([]);
  private cartTotalSubject = new BehaviorSubject<number>(0);
  private cartCountSubject = new BehaviorSubject<number>(0);

  private cartCache$?: Observable<ICart>;
  constructor(private http: HttpClient) {
    this.loadCartFromStorage();
  }

  getCartItems(): Observable<ICartItem[]> {
    return this.cartItemsSubject.asObservable();
  }

  getCartTotal(): Observable<number> {
    return this.cartTotalSubject.asObservable();
  }

  getCartCount(): Observable<number> {
    return this.cartCountSubject.asObservable();
  }

  addToCart(product: IProduct, quantity: number = 1, customerId?: string): void {
    const items = this.cartItemsSubject.value;
    const existing = items.find(i => i.Product.id === product.id);

    if (existing) {
      existing.quantity += quantity;
    } else {
      items.push({ Product: product, quantity });
    }

    this.updateCart(items);

    if (customerId) {
      this.syncItemToApi(customerId, product.id, existing ? existing.quantity : quantity).subscribe();
    }
  }

  removeFromCart(productId: string, customerId?: string): void {
    const items = this.cartItemsSubject.value.filter(i => i.Product.id !== productId);
    this.updateCart(items);

    if (customerId) {
      this.removeItemFromApi(customerId, productId).subscribe();
    }
  }

  clearCart(customerId?: string): void {
    this.updateCart([]);
    if (customerId) {
      this.clearCartFromApi(customerId).subscribe();
    }
  }

  updateQuantity(productId: string, quantity: number, customerId?: string): void {
    if (quantity <= 0) return this.removeFromCart(productId, customerId);

    const items = this.cartItemsSubject.value;
    const item = items.find(i => i.Product.id === productId);
    if (item) item.quantity = quantity;

    this.updateCart(items);

    if (customerId) {
      this.syncItemToApi(customerId, productId, quantity).subscribe();
    }
  }

  calculateItemPrice(item: ICartItem): number {
    const q = item.quantity;
    const p = item.Product;
    if (q >= 100 && p.pricePer100Piece) return p.pricePer100Piece * q;
    if (q >= 50 && p.pricePer50Piece) return p.pricePer50Piece * q;
    return (p.pricePerPiece || 0) * q;
  }

  private updateCart(items: ICartItem[]): void {
    this.cartItemsSubject.next([...items]);
    this.cartTotalSubject.next(items.reduce((t, i) => t + this.calculateItemPrice(i), 0));
    this.cartCountSubject.next(items.reduce((c, i) => c + i.quantity, 0));
    localStorage.setItem(this.cartKey, JSON.stringify(items));
  }

  private loadCartFromStorage(): void {
    try {
      const json = localStorage.getItem(this.cartKey);
      const items: ICartItem[] = json ? JSON.parse(json) : [];
      this.updateCart(items);
    } catch (e) {
      console.error('Failed to load cart from localStorage');
      this.updateCart([]);
    }
  }

 clearCache() {
  this.cartCache$ =  undefined;
  this.updateCart([]);
  localStorage.removeItem(this.cartKey);
}


ensureCartExists(customerId: string, forceRefresh = false): Observable<ICart> {
  if (this.cartCache$ && !forceRefresh) return this.cartCache$;

  const fetchCart = () => this.http.get<ICart>(`${this._baseUrl}/byCustomer/${customerId}`);

  const request$ = fetchCart().pipe(
    switchMap(cart => {
      console.log('Fetched cart:', cart); // Log cart details
      if (!cart?.id) {
        console.log('No cart found, creating new one for customer:', customerId);
        return this.http.post<ICart>(this._baseUrl, { customerId }).pipe(
          switchMap(newCart => {
            console.log('Created cart:', newCart); // Log created cart
            return fetchCart(); // Fetch again to ensure consistency
          })
        );
      }
      return of(cart);
    }),
    catchError(error => {
      console.error('Error in ensureCartExists:', error);
      if (error.status === 404 || error.status === 204 || (error.status === 500 && error.error?.includes('Not Found'))) {
        console.log('Cart not found, creating new one for customer:', customerId);
        return this.http.post<ICart>(this._baseUrl, { customerId }).pipe(
          switchMap(newCart => {
            console.log('Created cart after error:', newCart); // Log created cart
            return fetchCart();
          })
        );
      } else if (error.status === 409) {
        console.log('Cart conflict, fetching existing cart');
        return fetchCart();
      }
      return throwError(() => error);
    }),
    filter(cart => {
      if (!cart?.id) console.error('Cart ID is missing:', cart);
      return !!cart?.id;
    }),
    take(1),
    shareReplay(1)
  );

  if (!forceRefresh) {
    this.cartCache$ = request$;
  }

  return request$;
}


syncLocalCartWithApi(customerId: string): Observable<any> {
  const items = this.cartItemsSubject.value;

  return this.ensureCartExists(customerId, true).pipe(
    switchMap(cart => {
      if (!cart?.id) {
        console.error('❌ Invalid cart ID, cannot sync items:', cart);
        return throwError(() => new Error('Invalid cart ID'));
      }
      console.log('Syncing cart with ID:', cart.id);
      if (!items.length) {
        console.log('ℹ️ No items to sync.');
        return of(null);
      }

      const requests = items.map(item => {
        const dto: CartItemCreateDto = {
          cartId: cart.id,
          productId: item.Product.id,
          quantity: item.quantity
        };
        console.log('Syncing item:', dto); // Log item details
        return this.http.post(`${this._cartItemUrl}`, dto).pipe(
          catchError(error => {
            console.error('❌ Error syncing item:', error, dto);
            return of(null);
          })
        );
      });

      return forkJoin(requests);
    }),
    tap(() => {
      console.log('✅ Cart synced with API');
      this.loadCartFromApi(customerId);
    }),
    catchError(err => {
      console.error('❌ Failed syncing cart with API:', err);
      return of(null);
    })
  );
}



  private syncItemToApi(customerId: string, productId: string, quantity: number): Observable<any> {
    return this.ensureCartExists(customerId).pipe(
      switchMap(cart =>
        this.http.get<ICartItem[]>(`${this._cartItemUrl}/cart/${cart.id}`).pipe(
          switchMap(items => {
            const existing = items.find(i => i.Product.id === productId);
            if (existing) {
              return this.http.put(`${this._cartItemUrl}/${existing.id}`, {
                ...existing,
                quantity
              });
            } else {
              const dto: CartItemCreateDto = {
                cartId: cart.id,
                productId,
                quantity
              };
              return this.http.post(`${this._cartItemUrl}`, dto);
            }
          })
        )
      )
    );
  }

  private removeItemFromApi(customerId: string, productId: string): Observable<any> {
    return this.ensureCartExists(customerId).pipe(
      switchMap(cart =>
        this.http.get<ICartItem[]>(`${this._cartItemUrl}/cart/${cart.id}`).pipe(
          switchMap(items => {
            const existing = items.find(i => i.Product.id === productId);
            if (existing) {
              return this.http.delete(`${this._cartItemUrl}/${existing.id}`);
            }
            return of(null);
          })
        )
      )
    );
  }

  private clearCartFromApi(customerId: string): Observable<any> {
    return this.ensureCartExists(customerId).pipe(
      switchMap(cart =>
        this.http.get<ICartItem[]>(`${this._cartItemUrl}/cart/${cart.id}`).pipe(
          switchMap(items => {
            const deleteRequests = items.map(i =>
              this.http.delete(`${this._cartItemUrl}/${i.id}`).pipe(catchError(() => of(null)))
            );
            return forkJoin(deleteRequests);
          })
        )
      )
    );
  }

  private loadCartFromApi(customerId: string): void {
    this.http.get<ICart>(`${this._baseUrl}/byCustomer/${customerId}`).subscribe({
      next: (cart) => {
        this.cartItemsSubject.next(cart.cartItems || []);
        this.updateCart(cart.cartItems || []);
      },
      error: (err) => console.error('Error loading cart from API', err)
    });
  }
}
