import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, forkJoin, Observable, of, throwError } from 'rxjs';
import { catchError, tap, switchMap, map, take, shareReplay } from 'rxjs/operators';
import { IProduct } from '../models/i-product';
import { environment } from '../../environment/environment';

export interface IWishlist {
  id: string;
  customerId: string;
  customerName: string;
  products: IProduct[];
}

export interface WishListCreateDto {
  customerId: string;
}

@Injectable({
  providedIn: 'root'
})
export class WishlistService {
  private _baseUrl = `${environment.apiUrl}/WishList`;
  private _productWishlistUrl = `${environment.apiUrl}/ProductWishlist`;
  private wishlistKey = 'user_wishlist';

  private wishlist: IWishlist | null = null;
  private wishlistSubject = new BehaviorSubject<IProduct[]>([]);  //بيضمن إن أي حد يشترك فيه يوصل له أحدث نسخة من البيانات فورًا.
  // هو الـ "أنبوبة" اللي بتوصل الحالة دي من السيرفيس للكومبوننت

  constructor(private http: HttpClient) {
    this.loadWishlistFromLocalStorage();
  }

  getWishlistObservable(): Observable<IProduct[]> {
    return this.wishlistSubject.asObservable();
  }

  getWishlistFromService(): IWishlist | null {
    return this.wishlist;
  }

addToWishlist(product: IProduct, customerId?: string): void {
  if (!customerId) {
    console.error('❌ CustomerId is required to add to wishlist.');
    return;
  }

  this.ensureWishlistExists(customerId).subscribe({
    next: (wishlist) => {
      this.wishlist = wishlist;

      if (!this.wishlist.products.find(p => p.id === product.id)) {
        this.wishlist.products.push(product);
        this.updateWishlist();

        // Sync with API
        this.http.post(`${this._productWishlistUrl}`, {
          productId: product.id,
          wishListId: this.wishlist!.id   // ✅ هنا هيبقى موجود فعلاً
        }).subscribe({
          next: () => console.log('✅ Product added to wishlist in API'),
          error: err => {
            console.error('❌ Error adding product to wishlist in API:', err);
            // Rollback
            this.wishlist!.products = this.wishlist!.products.filter(p => p.id !== product.id);
            this.updateWishlist();
          }
        });
      }
    },
    error: (err) => {
      console.error('❌ Error ensuring wishlist exists:', err);
    }
  });
}


  removeFromWishlist(productId: string): void {
    if (!this.wishlist?.id) return;

    const wishlistId = this.wishlist.id;

    this.http.delete(`${this._productWishlistUrl}/${wishlistId}/${productId}`).subscribe({
      next: () => {
        console.log('✅ Product removed from wishlist in API');

        this.wishlist!.products = this.wishlist!.products.filter(p => p.id !== productId);
        this.updateWishlist();
      },
      error: err => {
        console.error('❌ Error removing product from wishlist in API:', err);
      }
    });
  }



  clearWishlist(): void {
    if (!this.wishlist?.id) return;

    const wishlistId = this.wishlist.id;

    this.http.delete(`${this._productWishlistUrl}/clear/${wishlistId}`).subscribe({
      next: () => {
        console.log('✅ Wishlist cleared from API');

        // 🧹 تنظيف محلي بعد نجاح الحذف من السيرفر
        this.wishlist!.products = [];
        this.updateWishlist();
      },
      error: err => {
        console.error('❌ Error clearing wishlist from API:', err);
      }
    });
  }


  isInWishlist(productId: string): boolean {
    return !!this.wishlist?.products.find(p => p.id === productId);
  }

  refreshWishlist(customerId: string): void {
    this.loadWishlistFromApi(customerId);
  }

  private updateWishlist(): void {
    const products = this.wishlist ? this.wishlist.products : [];
    this.wishlistSubject.next([...products]);
    this.saveWishlistToLocalStorage();
  }

  private saveWishlistToLocalStorage(): void {
    localStorage.setItem(this.wishlistKey, JSON.stringify(this.wishlist));
  }

  private loadWishlistFromLocalStorage(): void {
    const stored = localStorage.getItem(this.wishlistKey);
    if (stored) {
      try {
        this.wishlist = JSON.parse(stored);
        this.updateWishlist();
      } catch (error) {
        console.error('Error loading wishlist from local storage:', error);
        this.wishlist = null;
        this.updateWishlist();
      }
    }
  }

  private loadWishlistFromApi(customerId: string): void {
    this.http.get<IWishlist>(`${this._baseUrl}/byCustomer/${customerId}`).subscribe({
      next: wishlist => {
        this.wishlist = wishlist;
        this.updateWishlist();
      },
      error: error => console.error('Error loading wishlist from API:', error)
    });
  }

  private wishlistCache$: Observable<IWishlist> | null = null;

  ensureWishlistExists(customerId: string): Observable<IWishlist> {
    if (this.wishlistCache$) {
      return this.wishlistCache$;
    }

    this.wishlistCache$ = this.http.get<IWishlist>(`${this._baseUrl}/byCustomer/${customerId}`).pipe(
      switchMap(wishlist => {
        if (!wishlist?.id) {
          return this.http.post<IWishlist>(this._baseUrl, { customerId });
        }
        return of(wishlist);
      }),
      catchError(error => {
        if (error.status === 404) {
          return this.http.post<IWishlist>(this._baseUrl, { customerId });
        } else if (error.status === 409) { // Conflict
          // Wishlist already exists due to race condition, just fetch it again
          return this.http.get<IWishlist>(`${this._baseUrl}/byCustomer/${customerId}`);
        }
        return throwError(() => error);
      }),
      take(1),
      shareReplay(1) // 🧠 تحفظ القيمة وترجعها لأي مشتركين تانين بعدين
    );

    return this.wishlistCache$;
  }

  clearCache() {
    this.wishlistCache$ = null;
  }
  private addProductToApi(productId: string, wishlistId: string): Observable<any> {
    return this.http.post(`${this._productWishlistUrl}`, {
      productId,
      wishListId: wishlistId
    });
  }

  syncLocalWishlistWithApi(customerId: string, wishlistId: string): Observable<any> {
    const localProducts = this.wishlist?.products || [];

    if (localProducts.length === 0) {
      return of(null);
    }

    // 1. نجيب الـ wishlist الحقيقي من الـ API
    return this.http.get<IWishlist>(`${this._baseUrl}/byCustomer/${customerId}`).pipe(
      switchMap(apiWishlist => {
        const apiProductIds = new Set(apiWishlist.products.map(p => p.id));

        // 2. فلترة المنتجات اللي مش موجودة فعلاً في API
        const newProducts = localProducts.filter(p => !apiProductIds.has(p.id));

        if (newProducts.length === 0) {
          console.log('ℹ️ No new products to sync.');
          return of(null);
        }

        const itemObservables = newProducts.map(product =>
          this.addProductToApi(product.id, wishlistId).pipe(
            catchError(error => {
              console.error('❌ Error adding product to wishlist:', error);
              return of(null);
            })
          )
        );

        return forkJoin(itemObservables).pipe(
          tap(() => {
            console.log('✅ Wishlist synced with API successfully');
            this.loadWishlistFromApi(customerId); // تحديث الحالة
          })
        );
      }),
      catchError(err => {
        console.error('❌ Error loading wishlist before sync:', err);
        return of(null);
      })
    );
  }






}
