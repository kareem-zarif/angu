import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { IProduct } from '../models/i-product';

export interface CartItem {
  product: IProduct;
  quantity: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartItems: CartItem[] = [];
  private cartItemsSubject = new BehaviorSubject<CartItem[]>([]);
  private cartTotalSubject = new BehaviorSubject<number>(0);
  private cartCountSubject = new BehaviorSubject<number>(0);

  constructor() {
    this.loadCartFromStorage();
  }

  // Get cart items as observable
  getCartItems(): Observable<CartItem[]> {
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
  addToCart(product: IProduct, quantity: number = 1): void {
    const existingItem = this.cartItems.find(item => item.product.id === product.id);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      this.cartItems.push({ product, quantity });
    }

    this.updateCart();
  }

  // Remove product from cart
  removeFromCart(productId: string): void {
    this.cartItems = this.cartItems.filter(item => item.product.id !== productId);
    this.updateCart();
  }

  // Update product quantity
  updateQuantity(productId: string, quantity: number): void {
    const item = this.cartItems.find(item => item.product.id === productId);

    if (item) {
      item.quantity = quantity;

      if (quantity <= 0) {
        this.removeFromCart(productId);
      } else {
        this.updateCart();
      }
    }
  }

  // Clear cart
  clearCart(): void {
    this.cartItems = [];
    this.updateCart();
  }

  // Calculate product price based on quantity
  calculateItemPrice(item: CartItem): number {
    const { product, quantity } = item;

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
    localStorage.setItem('cart', JSON.stringify(this.cartItems));
  }

  private loadCartFromStorage(): void {
    const storedCart = localStorage.getItem('cart');

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
}
