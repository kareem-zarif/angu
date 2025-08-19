import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { environment } from '../../environment/environment';
import { IProduct } from '../models/i-product';
import { Auth } from './auth';

@Injectable({
  providedIn: 'root'
})
export class WishlistService {
  private readonly STORAGE_KEY = 'anonymous_wishlist';
  private wishlistSubject = new BehaviorSubject<IProduct[]>([]);

  constructor(
    private http: HttpClient,
    private auth: Auth
  ) {
    this.initializeWishlist();
  }

  private initializeWishlist(): void {
    if (this.auth.isLoggedIn()) {
      this.loadUserWishlist();
    } else {
      this.loadAnonymousWishlist();
    }
  }

  private loadUserWishlist(): void {
    const userId = this.auth.getCurrentUser()?.UserId;
    if (userId) {
      this.http.get<IProduct[]>(`${environment.apiUrl}/wishlist/${userId}`)
        .subscribe({
          next: (products) => this.wishlistSubject.next(products),
          error: (error) => console.error('Error loading user wishlist:', error)
        });
    }
  }

  private loadAnonymousWishlist(): void {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        const wishlist = JSON.parse(stored);
        this.wishlistSubject.next(wishlist);
      } catch (error) {
        console.error('Error parsing stored wishlist:', error);
        localStorage.removeItem(this.STORAGE_KEY);
      }
    }
  }

  getWishlistObservable(): Observable<IProduct[]> {
    return this.wishlistSubject.asObservable().pipe(
      debounceTime(100),
      distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr))
    );
  }

  addToWishlist(product: IProduct): void {
    const current = this.wishlistSubject.value;
    if (!current.find(p => p.id === product.id)) {
      const updated = [...current, product];
      this.wishlistSubject.next(updated);

      if (this.auth.isLoggedIn()) {
        this.saveUserWishlist(updated);
      } else {
        this.saveAnonymousWishlist(updated);
      }
    }
  }

  removeFromWishlist(productId: string): void {
    const updated = this.wishlistSubject.value.filter(p => p.id !== productId);
    this.wishlistSubject.next(updated);

    if (this.auth.isLoggedIn()) {
      this.saveUserWishlist(updated);
    } else {
      this.saveAnonymousWishlist(updated);
    }
  }

  clearWishlist(): void {
    this.wishlistSubject.next([]);
    if (this.auth.isLoggedIn()) {
      this.saveUserWishlist([]);
    } else {
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }

  private saveUserWishlist(wishlist: IProduct[]): void {
    const userId = this.auth.getCurrentUser()?.UserId;
    if (userId) {
      this.http.post(`${environment.apiUrl}/wishlist/${userId}`, wishlist)
        .subscribe({
          error: (error) => console.error('Error saving user wishlist:', error)
        });
    }
  }

  private saveAnonymousWishlist(wishlist: IProduct[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(wishlist));
  }
}
