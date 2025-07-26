import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService, CartItem } from '../../services/cart.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './cart.html',
  styleUrl: './cart.css'
})
export class Cart implements OnInit {
  cartItems: CartItem[] = [];
  cartTotal: number = 0;

  constructor(private cartService: CartService) { }

  ngOnInit(): void {
    // Subscribe to cart items
    this.cartService.getCartItems().subscribe(items => {
      this.cartItems = items;
    });

    // Subscribe to cart total
    this.cartService.getCartTotal().subscribe(total => {
      this.cartTotal = total;
    });
  }

  // Update quantity
  updateQuantity(productId: string, quantity: number): void {
    this.cartService.updateQuantity(productId, quantity);
  }

  // Remove item from cart
  removeItem(productId: string): void {
    this.cartService.removeFromCart(productId);
  }

  // Clear cart
  clearCart(): void {
    if (confirm('Are you sure you want to clear your cart?')) {
      this.cartService.clearCart();
    }
  }

  // Calculate item price
  calculateItemPrice(item: CartItem): number {
    return this.cartService.calculateItemPrice(item);
  }

  // Proceed to checkout
  checkout(): void {
    alert('Checkout functionality will be implemented in the future.');
    // Here you would typically navigate to a checkout page
  }
}
