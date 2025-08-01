import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService, CartItem } from '../../services/cart.service';
import { AccountService } from '../../services/account-service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './cart.html',
  styleUrl: './cart.css'
})
export class Cart implements OnInit, OnDestroy {
  cartItems: CartItem[] = [];
  cartTotal: number = 0;
  cartCount: number = 0;

  // Toast notification
  toastMessage: string | null = null;

  // Subscriptions
  private itemsSubscription: Subscription | null = null;
  private totalSubscription: Subscription | null = null;
  private countSubscription: Subscription | null = null;

  constructor(
    private cartService: CartService,
    private accountService: AccountService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Subscribe to cart items
    this.itemsSubscription = this.cartService.getCartItems().subscribe(items => {
      this.cartItems = items;
    });

    // Subscribe to cart total
    this.totalSubscription = this.cartService.getCartTotal().subscribe(total => {
      this.cartTotal = total;
    });

    // Subscribe to cart count
    this.countSubscription = this.cartService.getCartCount().subscribe(count => {
      this.cartCount = count;
    });
  }

  ngOnDestroy(): void {
    // Clean up subscriptions
    if (this.itemsSubscription) {
      this.itemsSubscription.unsubscribe();
    }

    if (this.totalSubscription) {
      this.totalSubscription.unsubscribe();
    }

    if (this.countSubscription) {
      this.countSubscription.unsubscribe();
    }
  }

  // Update quantity
  updateQuantity(productId: string, quantity: number): void {
    this.cartService.updateQuantity(productId, quantity);
    this.showToast('Cart updated');
  }

  // Remove item from cart
  removeItem(productId: string): void {
    const item = this.cartItems.find(item => item.product.id === productId);
    if (item) {
      this.cartService.removeFromCart(productId);
      this.showToast(`${item.product.name} removed from cart`);
    }
  }

  // Clear cart
  clearCart(): void {
    if (confirm('Are you sure you want to clear your cart?')) {
      this.cartService.clearCart();
      this.showToast('Cart cleared');
    }
  }

  // Calculate item price
  calculateItemPrice(item: CartItem): number {
    return this.cartService.calculateItemPrice(item);
  }

  // Show toast notification
  showToast(message: string): void {
    this.toastMessage = message;
    setTimeout(() => {
      this.toastMessage = null;
    }, 2000);
  }

  // Proceed to checkout
  checkout(): void {
    if (this.cartItems.length === 0) {
      this.showToast('Your cart is empty');
      return;
    }

    // Check if user is authenticated
    if (this.accountService.isAuthenticated) {
      // User is authenticated, redirect to checkout page
      // This will be implemented by the authentication team
      this.router.navigate(['/checkout']);
    } else {
      // User is not authenticated, redirect to login page
      // This will be implemented by the authentication team
      this.showToast('Please login to proceed to checkout');
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/checkout' } });
    }

    // Note: The actual checkout functionality will be implemented in the future
    // For now, we just show a message and redirect based on authentication status
  }

  // Increment quantity
  incrementQuantity(productId: string): void {
    const item = this.cartItems.find(item => item.product.id === productId);
    if (item) {
      this.updateQuantity(productId, item.quantity + 1);
    }
  }

  // Decrement quantity
  decrementQuantity(productId: string): void {
    const item = this.cartItems.find(item => item.product.id === productId);
    if (item && item.quantity > 1) {
      this.updateQuantity(productId, item.quantity - 1);
    }
  }
}
