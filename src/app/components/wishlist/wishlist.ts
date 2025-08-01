import { Component, OnInit, OnDestroy } from '@angular/core';
import { WishlistService } from '../../services/wishlist';
import { IProduct, ShippingTypes } from '../../models/i-product';
import {RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Rating } from '../rating/rating/rating';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [ RouterModule, CommonModule, Rating],
  templateUrl: './wishlist.html'
})
export class WishlistComponent implements OnInit, OnDestroy {
  wishlist: IProduct[] = [];
  shippingTypes = ShippingTypes;

  // Filter state
  selectedRating: number | null = null;
  selectedWarranty: number | null = null;
  selectedShipping: ShippingTypes = ShippingTypes.None;
  selectedAddress: string | null = null;

  // Toast notification
  toastMessage: string | null = null;

  // Subscription
  private subscription: Subscription | null = null;

  constructor(private wishlistService: WishlistService) { }

  ngOnInit(): void {
    // Initial load
    this.refreshWishlist();

    // Subscribe to wishlist changes
    this.subscription = this.wishlistService.getWishlistObservable().subscribe(products => {
      this.wishlist = products;
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  refreshWishlist(): void {
    this.wishlist = this.wishlistService.getWishlist();
    // Refresh from API
    this.wishlistService.refreshWishlist();
  }

  showToast(message: string): void {
    this.toastMessage = message;
    setTimeout(() => {
      this.toastMessage = null;
    }, 2000);
  }

  addToWishlist(product: IProduct): void {
    this.wishlistService.addToWishlist(product);
    this.showToast(`${product.name} added to wishlist`);
  }

  removeFromWishlist(product: IProduct): void {
    this.wishlistService.removeFromWishlist(product.id);
    this.showToast(`${product.name} removed from wishlist`);
  }

  isInWishlist(productId: string): boolean {
    return this.wishlistService.isInWishlist(productId);
  }

  setRatingFilter(rating: number | null): void {
    this.selectedRating = rating;
  }

  setWarrantyFilter(months: number | null): void {
    this.selectedWarranty = months;
  }

  setShippingFilter(shipping: ShippingTypes = ShippingTypes.None): void {
    this.selectedShipping = shipping;
  }

  get filteredWishlist(): IProduct[] {
    return this.wishlist.filter(product => {
      let matches = true;

      if (this.selectedRating !== null) {
        matches = matches && (product.rating ?? 0) >= this.selectedRating;
      }

      if (this.selectedWarranty !== null) {
        matches = matches && (product.warrantyNMonths ?? 0) >= this.selectedWarranty;
      }

      if (this.selectedShipping !== ShippingTypes.None) {
        matches = matches && product.shipping === this.selectedShipping;
      }

      // Address filter is a placeholder, implement as needed
      return matches;
    });
  }

  clearWishlist(): void {
    if (confirm('Are you sure you want to clear your wishlist?')) {
      this.wishlistService.clearWishlist();
      this.showToast('Wishlist cleared');
    }
  }
}
