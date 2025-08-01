import { Injectable } from '@angular/core';
import { ProductApprovalStatus, ShippingTypes } from '../models/i-product';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError, forkJoin } from 'rxjs';
import { catchError, map, tap, switchMap, take } from 'rxjs/operators';
import { IProduct } from '../models/i-product';
import {  IWishlist } from '../models/i-wishlist';

export interface WishListCreateDto {
  customerId: string;
}

export interface ProductWishlistCreateDto {
  productId: string;
  wishListId: string;
}

@Injectable({
  providedIn: 'root'
})
export class WishlistService {

  private _baseUrl = 'https://localhost:7777/api/WishList';
  private _productWishlistUrl = 'https://localhost:7777/api/ProductWishlist';
  private wishlistKey = 'user_wishlist';
  private wishlistSubject = new BehaviorSubject<IProduct[]>([]);
  private wishlistCountSubject = new BehaviorSubject<number>(0);

  constructor(private http: HttpClient) {
    this.loadWishlistFromLocalStorage();
  }

  // Get API URLs for external use
  getWishlistApiUrl(): string {
    return this._baseUrl;
  }

  getProductWishlistApiUrl(): string {
    return this._productWishlistUrl;
  }

  private loadWishlistFromLocalStorage(): void {
    const storedWishlist = localStorage.getItem(this.wishlistKey);
    if (storedWishlist) {
      try {
        const products = JSON.parse(storedWishlist);
        this.wishlistSubject.next(products);
        this.updateWishlistCount();
      } catch (error) {
        console.error('Error parsing wishlist from localStorage:', error);
        this.wishlistSubject.next([]);
        this.updateWishlistCount();
      }
    }
  }

  private saveWishlistToLocalStorage(products: IProduct[]): void {
    localStorage.setItem(this.wishlistKey, JSON.stringify(products));
    this.wishlistSubject.next(products);
    this.updateWishlistCount();
  }

  private updateWishlistCount(): void {
    this.wishlistCountSubject.next(this.wishlistSubject.getValue().length);
  }

  getWishlist(): IProduct[] {
    return this.wishlistSubject.getValue();
  }

  getWishlistObservable(): Observable<IProduct[]> {
    return this.wishlistSubject.asObservable();
  }

  getWishlistCount(): Observable<number> {
    return this.wishlistCountSubject.asObservable();
  }

  getWishlistFromApi(customerId: string): Observable<IWishlist> {
    return this.http.get<IWishlist>(`${this._baseUrl}/${customerId}`).pipe(
      tap(wishlist => {
        if (wishlist && wishlist.products) {
          this.saveWishlistToLocalStorage(wishlist.products);
        }
      }),
      catchError(error => {
        console.error('Error fetching wishlist from API:', error);
        // Return local wishlist as fallback
        return of({
          id: customerId,
          customerId: customerId,
          products: this.getWishlist(),
          customerName: ''
        });
      })
    );
  }

  addToWishlist(product: IProduct, customerId?: string): void {
    const currentWishlist = this.getWishlist();

    // Check if product already exists in wishlist
    if (!this.isInWishlist(product.id)) {
      const updatedWishlist = [...currentWishlist, product];
      this.saveWishlistToLocalStorage(updatedWishlist);

      // Sync with API if user is authenticated
      if (customerId) {
        this.syncWithApi(customerId, product.id);
      }
    }
  }

  removeFromWishlist(productId: string, customerId?: string): void {
    const currentWishlist = this.getWishlist();
    const updatedWishlist = currentWishlist.filter(p => p.id !== productId);
    this.saveWishlistToLocalStorage(updatedWishlist);

    // Sync with API if user is authenticated
    if (customerId) {
      this.removeFromApi(customerId, productId);
    }
  }


  clearWishlist(): void {
    this.saveWishlistToLocalStorage([]);
  }

  isInWishlist(productId: string): boolean {
    return this.getWishlist().some(p => p.id === productId);
  }

  refreshWishlist(customerId?: string): void {
    if (!customerId) {
      return;
    }

    this.getWishlistFromApi(customerId).subscribe({
      next: (wishlist) => {
        if (wishlist && wishlist.products) {
          this.saveWishlistToLocalStorage(wishlist.products);
        }
      },
      error: (error) => {
        console.error('Error refreshing wishlist:', error);
      }
    });
  }

  private syncWithApi(customerId: string, productId: string): void {
    // Check if wishlist exists for this customer
    this.http.get<IWishlist>(`${this._baseUrl}/${customerId}`).pipe(
      catchError(error => {
        if (error.status === 404) {
          // Wishlist doesn't exist, create it
          const wishlistDto: WishListCreateDto = { customerId };
          return this.http.post<IWishlist>(`${this._baseUrl}`, wishlistDto);
        }
        return throwError(() => error);
      }),
      switchMap((wishlist) => {
        // Add product to wishlist
        const productWishlistDto: ProductWishlistCreateDto = {
          productId: productId,
          wishListId: wishlist.id
        };

        return this.http.post(`${this._productWishlistUrl}`, productWishlistDto);
      })
    ).subscribe({
      next: () => console.log('Product added to wishlist in API'),
      error: (err) => console.error('Error adding product to wishlist in API:', err)
    });
  }

  private removeFromApi(customerId: string, productId: string): void {
    // Check if wishlist exists for this customer
    this.http.get<IWishlist>(`${this._baseUrl}/${customerId}`).pipe(
      catchError(error => {
        if (error.status === 404) {
          // Wishlist doesn't exist, nothing to remove
          return throwError(() => error);
        }
        return throwError(() => error);
      }),
      switchMap((wishlist) => {
        // Remove product from wishlist
        return this.http.delete(`${this._productWishlistUrl}/${wishlist.id}/${productId}`);
      })
    ).subscribe({
      next: () => console.log('Product removed from wishlist in API'),
      error: (err) => console.error('Error removing product from wishlist in API:', err)
    });
  }
}
