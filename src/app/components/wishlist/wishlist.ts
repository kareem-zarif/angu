import { Component, OnInit } from '@angular/core';
import { WishlistService } from '../../services/wishlist';
import { IProduct } from '../../models/i-product';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [RouterOutlet , CommonModule],
  templateUrl: './wishlist.html'
})
export class WishlistComponent implements OnInit {
  products: IProduct[] = [];
  wishlist: IProduct[] = [];

  // Filter state
  selectedRating: number | null = null;
  selectedWarranty: number | null = null;
  selectedShipping: string | null = null;
  selectedAddress: string | null = null; // Placeholder for address

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

  constructor(private wishlistService: WishlistService) {}

  ngOnInit(): void {
    this.products = this.wishlistService.getProducts();
    this.refreshWishlist();
  }

  addToWishlist(product: IProduct) {
    this.wishlistService.addToWishlist(product);
    this.refreshWishlist();
  }

  removeFromWishlist(productId: string) {
    this.wishlistService.removeFromWishlist(productId);
    this.refreshWishlist();
  }

  isInWishlist(productId: string): boolean {
    return this.wishlistService.isInWishlist(productId);
  }

  refreshWishlist() {
    this.wishlist = this.wishlistService.getWishlist();
  }

  clearWishlist() {
    this.wishlistService.clearWishlist();
    this.refreshWishlist();
  }

  setRatingFilter(rating: number | null) {
    this.selectedRating = rating;
  }

  setWarrantyFilter(warranty: number | null) {
    (this.selectedWarranty) = warranty;
  }

  setShippingFilter(shipping: string | null) {
    this.selectedShipping = shipping;
  }

  setAddressFilter(address: string | null) {
    this.selectedAddress = address;
  }
}