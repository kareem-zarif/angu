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
      this.ensureCartExists(customerId).subscribe({
        next: (cart) => {
          console.log('Cart ensured with ID:', cart.id);
          this.syncItemToApi(customerId, product.id, existing ? existing.quantity : quantity).subscribe({
            next: () => console.log('✅ Product added to cart in API'),
            error: (err) => {
              console.error('❌ Error adding product to cart in API:', err);
              if (existing) {
                existing.quantity -= quantity;
              } else {
                this.removeFromCart(product.id);
              }
              this.updateCart(items);
            }
          });
        },
        error: (err) => console.error('❌ Error ensuring cart exists:', err)
      });
    }
  }


  removeFromCart(productId: string, customerId?: string): void {
    const items = this.cartItemsSubject.value.filter(i => i.Product.id !== productId);
    this.updateCart(items);

    if (customerId) {
      this.removeItemFromApi(customerId, productId).subscribe();
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
    if (!item.Product || item.Product.pricePerPiece == null) {
      return 0;
    }
    const q = item.quantity;
    const p = item.Product;
    if (q >= 100 && p.pricePer100Piece) return p.pricePer100Piece * q;
    if (q >= 50 && p.pricePer50Piece) return p.pricePer50Piece * q;
    return (p?.pricePerPiece || 0) * q;
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
    this.cartCache$ = undefined;
  }


  ensureCartExists(customerId: string, forceRefresh = false): Observable<ICart> {
    if (this.cartCache$ && !forceRefresh) return this.cartCache$;

    const fetchCart = () => this.http.get<ICart>(`${this._baseUrl}/byCustomer/${customerId}`);

    const request$ = fetchCart().pipe(
      switchMap(cart => {
        console.log('Fetched cart:', cart);
        if (!cart?.id) {
          console.log('Creating new cart for customer:', customerId);
          return this.http.post<ICart>(this._baseUrl, { customerId }).pipe(
            tap(newCart => console.log('Created cart:', newCart)),
            switchMap(newCart => {
              // Verify cart exists in DB by fetching it
              return this.http.get<ICart>(`${this._baseUrl}/${newCart.id}`);
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
            tap(newCart => console.log('Created cart:', newCart)),
            switchMap(newCart => {
              // Verify cart exists in DB
              return this.http.get<ICart>(`${this._baseUrl}/${newCart.id}`);
            })
          );
        }
        return throwError(() => new Error('Failed to ensure cart exists'));
      }),
      filter(cart => {
        if (!cart?.id) {
          console.error('Invalid cart ID:', cart);
          throw new Error('Cart ID is missing');
        }
        return true;
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
    const localItems: ICartItem[] = JSON.parse(localStorage.getItem(this.cartKey) || '[]');

    return this.ensureCartExists(customerId, true).pipe(
      switchMap(cart => {
        if (!cart?.id) {
          console.error('❌ Invalid cart ID');
          return throwError(() => new Error('Invalid cart ID'));
        }

        return this.http.get<ICart>(`${this._baseUrl}/byCustomer/${customerId}`).pipe(
          switchMap(apiCart => {
            const apiItems = apiCart.cartItems || [];
            console.log('🟡 Local items:', localItems, '🟣 API items:', apiItems);

            // إضافة/تحديث العناصر
            const addOrUpdateRequests = localItems.map(localItem => {
              const existingApiItem = apiItems.find(apiItem => apiItem.Product?.id === localItem.Product.id);
              const dto: CartItemCreateDto = {
                cartId: cart.id,
                productId: localItem.Product.id,
                quantity: localItem.quantity
              };

              if (existingApiItem) {
                console.log(`🔄 Updating item: ${dto.productId}`);
                return this.http.put(`${this._cartItemUrl}/${existingApiItem.id}`, dto).pipe(
                  catchError(err => {
                    console.error('❌ Error updating item:', err);
                    return of(null);
                  })
                );
              }

              console.log(`➕ Adding item: ${dto.productId}`);
              return this.http.post(`${this._cartItemUrl}`, dto).pipe(
                catchError(err => {
                  console.error('❌ Error adding item:', err);
                  return of(null);
                })
              );
            });

            // حذف العناصر غير الموجودة في localStorage
            const deleteRequests = apiItems
              .filter(apiItem => !localItems.some(localItem => localItem.Product.id === apiItem.Product?.id))
              .map(apiItem => {
                console.log(`🗑️ Deleting item: ${apiItem.Product?.name}`);
                return this.http.delete(`${this._cartItemUrl}/${apiItem.id}`).pipe(
                  catchError(err => {
                    console.error('❌ Error deleting item:', err);
                    return of(null);
                  })
                );
              });

            return forkJoin([...addOrUpdateRequests, ...deleteRequests]).pipe(
              //forkJoin: Runs multiple Observables (like add/delete requests) in parallel and waits for all to complete.
              switchMap(() => this.loadCartFromApi(customerId)) // تحديث localStorage بعد التزامن
              // switchMap: Transforms one Observable into another, ensuring the previous operation completes first
            );
          })
        );
      }),
      catchError(err => {
        console.error('❌ Sync failed:', err);
        return of(null);
      })
    );
  }






  private syncItemToApi(customerId: string, productId: string, quantity: number): Observable<any> {
    return this.ensureCartExists(customerId).pipe(
      switchMap(cart => {
        console.log('Syncing item with CartId:', cart.id, 'ProductId:', productId, 'Quantity:', quantity);
        return this.http.get<ICartItem>(`${this._cartItemUrl}/${cart.id}/${productId}`).pipe(
          switchMap(item => {
            console.log('Updating existing cart item:', item);
            return this.http.put(`${this._cartItemUrl}/${item.id}`, {
              id: item.id,
              cartId: cart.id,
              productId,
              quantity
            });
          }),
          catchError(error => {
            if (error.status === 404) {
              console.log('Creating new cart item for CartId:', cart.id);
              const dto: CartItemCreateDto = {
                cartId: cart.id,
                productId,
                quantity
              };
              return this.http.post(`${this._cartItemUrl}`, dto);
            }
            console.error('Error checking cart item:', error);
            return throwError(() => new Error('Failed to sync cart item'));
          })
        );
      }),
      catchError(error => {
        console.error('Error syncing item to cart:', error);
        return of(null); // Prevent app crash
      })
    );
  }



  private removeItemFromApi(customerId: string, productId: string): Observable<any> {
    return this.ensureCartExists(customerId).pipe(
      switchMap(cart =>
        this.http.get<ICartItem>(`${this._cartItemUrl}/${cart.id}/${productId}`).pipe(
          switchMap(found => {
            const existing = found;
            if (existing) {
              return this.http.delete(`${this._cartItemUrl}/${existing.id}`);
            }
            return of(null); // المنتج مش موجود في الكارت
          })
        )
      ),
      catchError(error => {
        console.error('🛑 Error removing item from cart:', error);
        return throwError(() => new Error('🚫 فشل في حذف المنتج: لم يتم إنشاء الكارت أو حدث خطأ في الاتصال.'));
      })
    );
  }

  clearCart(customerId?: string): void {
    // Clear local storage and update subjects
    this.updateCart([]);

    // If customerId is provided, clear cart items in the backend
    if (customerId) {
      this.clearCartFromApi(customerId).subscribe({
        next: () => console.log('✅ Cart cleared in API'),
        error: (err) => console.error('❌ Error clearing cart in API:', err)
      });
    }
  }
  private clearCartFromApi(customerId: string): Observable<any> {
    return this.ensureCartExists(customerId).pipe(
      switchMap(cart => {
        if (!cart?.id) {
          console.error('❌ Invalid cart ID');
          return of(null); //returns Observable<null>
          //as return null → returns a plain value, and will break the RxJS stream
        }
        // Call the new endpoint to delete all cart items for the cart
        return this.http.delete(`${this._cartItemUrl}/cart/${cart.id}`).pipe(
          catchError(err => {
            console.error('❌ Error clearing cart items from API:', err);
            return of(null); // Prevent app crash
          })
        );
      })
    );
  }

  private loadCartFromApi(customerId: string): Observable<void> {
    return this.http.get<ICart>(`${this._baseUrl}/byCustomer/${customerId}`).pipe(
      tap((cart) => {
        const validItems = (cart.cartItems || []).filter(i => i?.Product);
        this.updateCart(validItems);
      }),
      catchError((err) => {
        console.error('Error loading cart from API', err);
        return of(undefined);
      }),
      map(() => undefined)
    );
  }

}
