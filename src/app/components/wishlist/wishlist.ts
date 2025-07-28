import { Component, OnInit } from '@angular/core';
import { WishlistService } from '../../services/wishlist';
import { IProduct } from '../../models/i-product';
import { RouterOutlet, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Rating } from '../rating/rating/rating';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [RouterOutlet, RouterModule, CommonModule, Rating],
  templateUrl: './wishlist.html'
})
export class WishlistComponent implements OnInit {
  products: IProduct[] = [];
  wishlist: IProduct[] = [];

  // Filter state
  selectedRating: number | null = null;
  selectedWarranty: number | null = null;
  selectedShipping: string | null = null;
  selectedAddress: string | null = null;

  // Placeholder for address
  toastMessage: string | null = null;

  constructor(private wishlistService: WishlistService) { }

  ngOnInit(): void {
    this.products = this.wishlistService.getProducts();
    this.refreshWishlist();
  }

  refreshWishlist(): void {
    this.wishlist = this.wishlistService.getWishlist();
  }

  showToast(message: string): void {
    this.toastMessage = message;
    setTimeout(() => {
      this.toastMessage = null;
    }, 2000);
  }

  addToWishlist(product: IProduct): void {
    this.wishlistService.addToWishlist(product);
    this.refreshWishlist();
    this.showToast(`${product.name} added to wishlist`);
  }

  removeFromWishlist(product: IProduct): void {
    this.wishlistService.removeFromWishlist(product.id);
    this.refreshWishlist();
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

  setShippingFilter(shipping: string | null): void {
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

      if (this.selectedShipping !== null) {
        matches = matches && product.shipping === this.selectedShipping;
      }

      // Address filter is a placeholder, implement as needed
      return matches;
    });
  }

  clearWishlist(){
    this.wishlistService.clearWishlist()
  }
}
