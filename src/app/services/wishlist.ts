import { Injectable } from '@angular/core';
import { IProduct } from '../models/i-product';
import { BehaviorSubject, Observable } from 'rxjs';
import { ProductService } from './product-service';

@Injectable({
  providedIn: 'root'
})
export class WishlistService {
  private wishlistItems: IProduct[] = [];
  private wishlistCountSubject = new BehaviorSubject<number>(0);

  constructor(private productService: ProductService) {
    this.loadWishlistFromStorage();
  }

  // Get wishlist count as observable
  getWishlistCount(): Observable<number> {
    return this.wishlistCountSubject.asObservable();
  }

  // Get all products
  getProducts(): IProduct[] {
    return this.productService.getAllDummy();
  }

  // Get wishlist items
  getWishlist(): IProduct[] {
    return [...this.wishlistItems];
  }

  // Add product to wishlist
  addToWishlist(product: IProduct): void {
    if (!this.isInWishlist(product.id)) {
      this.wishlistItems.push(product);
      this.saveWishlistToStorage();
      this.updateWishlistCount();
    }
  }

  // Remove product from wishlist
  removeFromWishlist(productId: string): void {
    this.wishlistItems = this.wishlistItems.filter(item => item.id !== productId);
    this.saveWishlistToStorage();
    this.updateWishlistCount();
  }

  clearWishlist(): void {
    this.wishlistItems = [];
    this.saveWishlistToStorage();
    this.updateWishlistCount();
  }

  // Check if product is in wishlist
  isInWishlist(productId: string): boolean {
    return this.wishlistItems.some(item => item.id === productId);
  }

  // Refresh wishlist (for compatibility with existing code)
  refreshWishlist(): void {
    this.loadWishlistFromStorage();
  }

  // Update wishlist count
  private updateWishlistCount(): void {
    this.wishlistCountSubject.next(this.wishlistItems.length);
  }

  // Save wishlist to localStorage
  private saveWishlistToStorage(): void {
    const wishlistIds = this.wishlistItems.map(item => item.id);
    localStorage.setItem('wishlist', JSON.stringify(wishlistIds));
  }

  // Load wishlist from localStorage
  private loadWishlistFromStorage(): void {
    const savedWishlist = localStorage.getItem('wishlist');
    if (savedWishlist) {
      try {
        const wishlistIds = JSON.parse(savedWishlist);
        const allProducts = this.productService.getAllDummy();

        this.wishlistItems = wishlistIds
          .map((id:string) => allProducts.find(product => product.id === id))
          .filter((product:IProduct) => product !== undefined) as IProduct[];


        this.updateWishlistCount();
      } catch (error) {
        console.error('Error loading wishlist from storage:', error);
        this.wishlistItems = [];
        this.updateWishlistCount();
      }
    }
  }
}
