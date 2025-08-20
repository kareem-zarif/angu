import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../services/cart.service';
import { Subscription, switchMap } from 'rxjs';
import { ICartItem } from '../../models/i-cart-item';
import { Auth, User } from '../../services/auth';
import { OrdersService } from '../../services/orders-service';
import { PaymentService } from '../../services/payment-service';
import { IOrder } from '../../models/i-order';
import { IPaymentMethod } from '../../models/i-payment-method';
import { PaymentMethodService } from '../../services/payment-method-service';
import { Role } from '../../models/enums/roles';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './cart.html',
  styleUrl: './cart.css'
})
export class Cart implements OnInit, OnDestroy {
  cartItems: ICartItem[] = [];
  cartTotal: number = 0;
  cartCount: number = 0;
  paymentMethods: IPaymentMethod[] = [];
  selectedPaymentMethodId: string | undefined;

  // Toast notification
  toastMessage: string | null = null;

  // Subscriptions
  private subscriptions: Subscription[] = [];

  // Current user
  currentUserId: string | undefined = undefined;

  constructor(
    private cartService: CartService,
    private _auth: Auth,
    private router: Router,
    private ordersService: OrdersService,
    private paymentService: PaymentService,
    private paymentMethodService: PaymentMethodService
  ) { }

  ngOnInit(): void {
    // ✅ Subscribe to currentUser$
    this.subscriptions.push(
      this._auth.currentUser$.subscribe((user: User | null) => {
        this.currentUserId = user?.UserId;
        if (this.currentUserId) {
          this.loadPaymentMethods();
        } else {
          this.paymentMethods = [];
          this.selectedPaymentMethodId = undefined;
        }
      })
    );

    // Subscribe to cart items
    this.subscriptions.push(
      this.cartService.getCartItems().subscribe(items => {
        this.cartItems = items;
      })
    );

    // Subscribe to cart total
    this.subscriptions.push(
      this.cartService.getCartTotal().subscribe(total => {
        this.cartTotal = total;
      })
    );

    // Subscribe to cart count
    this.subscriptions.push(
      this.cartService.getCartCount().subscribe(count => {
        this.cartCount = count;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // Update quantity
  updateQuantity(productId: string, quantity: number): void {
    this.cartService.updateQuantity(productId, quantity, this.currentUserId);
    this.showToast('Cart updated');
  }

  // Remove item from cart
  removeItem(productId: string): void {
    const item = this.cartItems.find(item => item.Product.id === productId);
    if (item) {
      this.cartService.removeFromCart(productId, this.currentUserId);
      this.showToast(`${item.Product.name} removed from cart`);
    }
  }

  // Clear cart
  clearCart(): void {
    if (confirm('Are you sure you want to clear your cart?')) {
      this.cartService.clearCart(this.currentUserId);
      this.showToast('Cart cleared');
    }
  }

  // Calculate item price
  calculateItemPrice(item: ICartItem): number {
    return this.cartService.calculateItemPrice(item);
  }

  // Show toast notification
  showToast(message: string): void {
    this.toastMessage = message;
    setTimeout(() => {
      this.toastMessage = null;
    }, 2000);
  }

  loadPaymentMethods(): void {
    if (this.currentUserId) {
      this.paymentMethodService.getPaymentMethods(this.currentUserId).subscribe({
        next: (methods) => {
          this.paymentMethods = methods;
          console.log('Payment Methods:', methods);
          if (methods.length > 0 && !this.selectedPaymentMethodId) {
            this.selectedPaymentMethodId = methods.find(pm => pm.isDefault)?.id || methods[0].id;
            console.log('Selected Payment Method ID:', this.selectedPaymentMethodId);
          }
        },
        error: () => this.showToast('Failed to load payment methods')
      });
    }
  }
  // Proceed to checkout
  checkout(): void {
    if (this.cartItems.length === 0) {
      this.showToast('Your cart is empty');
      return;
    }

    // Check login first
    if (!this._auth.isLoggedIn()) {
      this.showToast('Please login to proceed to checkout');
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/customer/checkout' } });
      return;
    }

    // Check if user is customer
    const user = this._auth.getCurrentUser();
    if (!user?.roles?.includes(Role.Customer) ||
      user.roles.includes(Role.Admin) ||
      user.roles.includes(Role.Supplier)) {
      this.router.navigate(['/forbidden'], {
        queryParams: {
          requiredRoles: Role.Customer,
          currentRole: user?.roles?.[0] || 'Guest',
          message: 'Only customers can proceed to checkout'
        }
      });
      return;
    }

    this.ordersService.createOrderFromCart(this.currentUserId!, this.selectedPaymentMethodId).pipe(
      switchMap((order: IOrder) => this.paymentService.processCheckout(order.id))
    ).subscribe({
      next: () => console.log('✅ Redirecting to payment'),
      error: (err: any) => {
        console.error('❌ Error during checkout:', err);
        this.showToast('Failed to process checkout');
      }
    });
  }

  // Increment quantity
  incrementQuantity(productId: string): void {
    const item = this.cartItems.find(item => item.Product.id === productId);
    if (item) {
      this.updateQuantity(productId, item.quantity + 1);
    }
  }

  // Decrement quantity
  decrementQuantity(productId: string): void {
    const item = this.cartItems.find(item => item.Product.id === productId);
    if (item && item.quantity > 1) {
      this.updateQuantity(productId, item.quantity - 1);
    }
  }
}
