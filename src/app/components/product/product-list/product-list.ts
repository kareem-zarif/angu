import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { IProduct } from '../../../models/i-product';
import { Subscription } from 'rxjs';
import { ProductService } from '../../../services/product-service';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Rating } from "../../rating/rating/rating";
import { Sidebar } from "../products-sidebar/sidebar/sidebar";
import { Categories } from "../category-list/categories/categories";
import { WishlistService } from '../../../services/wishlist';
import { Pagination } from "../../pagination/pagination";
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, Rating, Sidebar, Categories, Pagination, RouterModule],
  templateUrl: './product-list.html',
  styleUrl: './product-list.css',
  providers: [ProductService] // for lazy loading
})
export class ProductList implements OnInit, OnDestroy {
  sub: Subscription | null = null;
  allProducts: IProduct[] = [];
  filteredProducts: IProduct[] = [];
  displayedProducts: IProduct[] = [];
  foundProduct: IProduct | null | undefined = null;

  // Filter states
  selectedCategory: string | null = null;
  selectedRating: number | null = null;
  priceRange: [number, number] = [0, 0]; // Will be set dynamically
  minPrice: number = 0;
  maxPrice: number = 0;
  selectedSuppliers: string[] = [];
  includeOutOfStock: boolean = true;

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 12;

  constructor(
    public _ProductService: ProductService,
    public ac: ActivatedRoute,
    private wishlistService: WishlistService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.allProducts = this._ProductService.getAllDummy();
    this.calculatePriceRange();
    this.filteredProducts = [...this.allProducts];
    this.updateDisplayedProducts();
  }

  ngOnDestroy(): void {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

  // Calculate min and max prices from all products
  calculatePriceRange(): void {
    if (this.allProducts.length === 0) return;

    // Get all possible prices (per piece, per 50, per 100)
    const allPrices = this.allProducts.flatMap(product => {
      const prices = [];
      if (product.pricePerPiece) prices.push(product.pricePerPiece);
      if (product.pricePer50Piece) prices.push(product.pricePer50Piece);
      if (product.pricePer100Piece) prices.push(product.pricePer100Piece);
      return prices;
    }).filter(price => price !== null && price !== undefined);

    // Set min and max prices
    this.minPrice = Math.floor(Math.min(...allPrices));
    this.maxPrice = Math.ceil(Math.max(...allPrices));

    // Initialize price range
    this.priceRange = [this.minPrice, this.maxPrice];
  }

  getById() {
    // subscribe to route params
    this.sub = this.ac.params.subscribe(prms => {
      const id: string = prms['id'];
      this.foundProduct = this._ProductService.getByIdDummy(id);
      if (!this.foundProduct)
        console.warn('Product not found for id:', prms['id']);
    });
  }

  del(id: string) {
    const confirmed = confirm('sure to delete');
    if (confirmed) {
      this.allProducts = this._ProductService.removeDummy(id);
      this.calculatePriceRange();
      this.applyFilters();
    }
  }

  // Navigate to product details
  navigateToProductDetails(product: IProduct, event: Event): void {
    // Prevent navigation if the click was on a button inside the product card
    if ((event.target as HTMLElement).closest('button')) {
      return;
    }

    this.router.navigate(['/products', product.id]);
  }

  // Handle category selection from Categories component
  onCategorySelected(categoryId: string) {
    this.selectedCategory = categoryId;
    this.applyFilters();
  }

  // Handle filter changes from Sidebar component
  onFilterChange(filters: any) {
    this.selectedRating = filters.rating;
    this.priceRange = filters.priceRange;
    this.selectedSuppliers = filters.suppliers;
    this.includeOutOfStock = filters.includeOutOfStock;
    this.applyFilters();
  }

  // Apply all filters to products
  applyFilters() {
    this.filteredProducts = this.allProducts.filter(product => {
      // Category filter
      if (this.selectedCategory && product.subCategoryId !== this.selectedCategory) {
        return false;
      }

      // Rating filter
      if (this.selectedRating !== null && (product.rating || 0) < this.selectedRating) {
        return false;
      }

      // Price filter - check all price types
      const productPrices = [
        product.pricePerPiece,
        product.pricePer50Piece,
        product.pricePer100Piece
      ].filter(price => price !== null && price !== undefined);

      // If any price is within range, include the product
      const anyPriceInRange = productPrices.some(
        price => price >= this.priceRange[0] && price <= this.priceRange[1]
      );

      if (!anyPriceInRange) {
        return false;
      }

      // Supplier filter
      if (this.selectedSuppliers.length > 0 &&
        (!product.supplierNames || !product.supplierNames.some(s => this.selectedSuppliers.includes(s)))) {
        return false;
      }

      // Stock filter
      if (!this.includeOutOfStock && (product.noInStock || 0) <= 0) {
        return false;
      }

      return true;
    });

    // Reset to first page when filters change
    this.currentPage = 1;
    this.updateDisplayedProducts();
  }

  // Update price range based on filtered products
  updatePriceRangeForFilteredProducts() {
    if (this.filteredProducts.length === 0) return;

    const filteredPrices = this.filteredProducts.flatMap(product => {
      const prices = [];
      if (product.pricePerPiece) prices.push(product.pricePerPiece);
      if (product.pricePer50Piece) prices.push(product.pricePer50Piece);
      if (product.pricePer100Piece) prices.push(product.pricePer100Piece);
      return prices;
    }).filter(price => price !== null && price !== undefined);

    const newMin = Math.floor(Math.min(...filteredPrices));
    const newMax = Math.ceil(Math.max(...filteredPrices));

    // Only update if the user hasn't manually adjusted the range
    if (this.priceRange[0] === this.minPrice) {
      this.minPrice = newMin;
      this.priceRange[0] = newMin;
    }

    if (this.priceRange[1] === this.maxPrice) {
      this.maxPrice = newMax;
      this.priceRange[1] = newMax;
    }
  }

  // Update displayed products based on current page
  updateDisplayedProducts() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.displayedProducts = this.filteredProducts.slice(startIndex, endIndex);
  }

  // Handle page change from pagination component
  onPageChange(page: number) {
    this.currentPage = page;
    this.updateDisplayedProducts();

    // Scroll to top of products container
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  // Toggle wishlist status
  toggleWishlist(product: IProduct) {
    if (this.isInWishlist(product)) {
      this.wishlistService.removeFromWishlist(product.id);
    } else {
      this.wishlistService.addToWishlist(product);
    }
  }

  // Check if product is in wishlist
  isInWishlist(product: IProduct): boolean {
    return this.wishlistService.isInWishlist(product.id);
  }
}
