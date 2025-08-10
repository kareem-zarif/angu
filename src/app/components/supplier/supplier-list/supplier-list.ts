import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { ISupplier } from '../../../models/i-supplier';
import { IProduct, ShippingTypes } from '../../../models/i-product';
import { SupplierService } from '../../../services/supplier.service';
import { CartService } from '../../../services/cart.service';
import { Rating } from '../../rating/rating/rating';
import { SupplierSidebar } from '../supplier-sidebar/supplier-sidebar';
import { Pagination } from '../../pagination/pagination';
import { SubCategoryService } from '../../../services/sub-category.service';
import { WishlistService } from '../../../services/wishlistService';
import { Auth } from '../../../services/auth';

@Component({
  selector: 'app-supplier-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    Rating,
    SupplierSidebar,
    Pagination
  ],
  templateUrl: './supplier-list.html',
  styleUrl: './supplier-list.css'
})
export class SupplierList implements OnInit, OnDestroy {
  // Suppliers data
  allSuppliers: ISupplier[] = [];
  filteredSuppliers: ISupplier[] = [];
  displayedSuppliers: ISupplier[] = [];

  // Filter states
  selectedCategory: string | null = null;
  selectedSubCategory: string | null = null;
  selectedRating: number | null = null;
  selectedWarranty: string | null = null;
  selectedCity: string | null = null;
  selectedState: string | null = null;
  selectedShipping: string | null = null;

  // Location data
  cities: string[] = [];
  states: string[] = [];

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 8;

  // UI states
  loading: boolean = false;
  error: string | null = null;

  // Subcategory mapping
  private subCategoryToCategory: Map<string, string> = new Map();

  //user
  currentUserId: string | undefined = undefined;

  private subscription: Subscription | null = null;

  constructor(
    private supplierService: SupplierService,
    private subCategoryService: SubCategoryService,
    private cartService: CartService,
    private wishlistService: WishlistService,
    private router: Router,
    private _auth:Auth
  ) { }

  ngOnInit(): void {
    this.currentUserId=this._auth.getCurrentUser()?.UserId;
    // Load subcategory mapping
    this.loadSubCategoryMapping();

    // Load suppliers
    this.loadSuppliers();

    // Load location data
    this.supplierService.getAllCities().subscribe(cities => {
      this.cities = cities;
    });

    this.supplierService.getAllStates().subscribe(states => {
      this.states = states;
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  loadSubCategoryMapping(): void {
    this.subCategoryService.getAll().subscribe({
      next: (subCategories) => {
        subCategories.forEach(sc => {
          this.subCategoryToCategory.set(sc.id, sc.categoryId);
        });
      },
      error: (error) => {
        console.error('Error loading subcategory mapping:', error);
      }
    });
  }

  loadSuppliers(): void {
    this.loading = true;
    this.error = null;

    this.subscription = this.supplierService.getAllSuppliers().subscribe({
      next: (suppliers) => {
        this.allSuppliers = suppliers;
        this.filteredSuppliers = [...this.allSuppliers];
        this.updateDisplayedSuppliers();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading suppliers:', error);
        this.error = 'Failed to load suppliers. Please try again later.';
        this.loading = false;
      }
    });
  }

  // Handle category selection
  onCategorySelected(categoryId: string | null): void {
    this.selectedCategory = categoryId;
    this.selectedSubCategory = null; // Reset subcategory when category changes
    this.applyFilters();
  }

  // Handle subcategory selection
  onSubCategorySelected(subCategoryId: string | null): void {
    this.selectedSubCategory = subCategoryId;
    // If a subcategory is selected, we can determine its parent category
    if (subCategoryId && this.subCategoryToCategory.has(subCategoryId)) {
      this.selectedCategory = this.subCategoryToCategory.get(subCategoryId) || null;
    }
    this.applyFilters();
  }

  // Handle filter changes from sidebar
  onFilterChange(filters: any): void {
    this.selectedRating = filters.rating;
    this.selectedWarranty = filters.warranty;
    this.selectedCity = filters.city;
    this.selectedState = filters.state;
    this.selectedShipping = filters.shipping;
    this.applyFilters();
  }

  // Apply all filters
  applyFilters(): void {
    // Use the service's searchSuppliers method with all filters
    this.supplierService.searchSuppliers(null, {
      city: this.selectedCity || undefined,
      state: this.selectedState || undefined,
      rating: this.selectedRating || undefined,
      warranty: this.selectedWarranty || undefined,
      shipping: this.selectedShipping || undefined
    }).subscribe(suppliers => {
      // Further filter by category/subcategory (these are not handled by the service)
      this.filteredSuppliers = suppliers.filter(supplier => {
        const products = supplier.products || [];

        // Filter by subcategory
        if (this.selectedSubCategory && !products.some(p => p.subCategoryId === this.selectedSubCategory)) {
          return false;
        }

        // Filter by category (only apply if subcategory is not selected)
        if (!this.selectedSubCategory && this.selectedCategory &&
          !products.some(p => this.isCategoryMatch(p.subCategoryId, this.selectedCategory!))) {
          return false;
        }

        return true;
      });

      // Reset to first page when filters change
      this.currentPage = 1;
      this.updateDisplayedSuppliers();
    });
  }

  // Update displayed suppliers based on pagination
  updateDisplayedSuppliers(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.displayedSuppliers = this.filteredSuppliers.slice(startIndex, endIndex);
  }

  // Handle page change
  onPageChange(page: number): void {
    this.currentPage = page;
    this.updateDisplayedSuppliers();

    // Scroll to top
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  // Navigate to product details
  navigateToProductDetails(productId: string, event: Event): void {
    event.stopPropagation(); // Prevent event bubbling
    this.router.navigate(['/products', productId]);
  }

  // Add product to cart (for sample request)
  requestSample(product: IProduct, event: Event): void {
    event.stopPropagation(); // Prevent event bubbling
    this.cartService.addToCart(product,undefined,this.currentUserId);
    this.showToast(`تمت إضافة ${product.name} إلى السلة`);
  }

  // Toggle wishlist
  toggleWishlist(product: IProduct, event: Event): void {
    event.stopPropagation(); // Prevent event bubbling

    if (this.isInWishlist(product.id)) {
      this.wishlistService.removeFromWishlist(product.id);
      this.showToast(`تمت إزالة ${product.name} من المفضلة`);
    } else {
      this.wishlistService.addToWishlist(product, this.currentUserId);
      this.showToast(`تمت إضافة ${product.name} إلى المفضلة`);
    }
  }

  // Check if product is in wishlist
  isInWishlist(productId: string): boolean {
    return this.wishlistService.isInWishlist(productId);
  }

  // Show toast notification
  toastMessage: string | null = null;

  showToast(message: string): void {
    this.toastMessage = message;
    setTimeout(() => {
      this.toastMessage = null;
    }, 3000);
  }

  // Add product to cart
  addToCart(product: IProduct): void {
    this.cartService.addToCart(product,undefined,this.currentUserId);
    // Show toast or notification here
  }

  // Get top 3 products for a supplier
  getTopProducts(supplier: ISupplier): IProduct[] {
    if (!supplier.products || supplier.products.length === 0) return [];

    // Sort by rating (highest first) and take top 3
    return [...supplier.products]
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 3);
  }

  // View all products from a supplier
  viewSupplierProducts(supplierName: string): void {
    this.router.navigate(['/products'], {
      queryParams: {
        supplier: supplierName,
        supplierName: supplierName // Add the supplier name as a separate parameter
      }
    });
  }

  // Helper method to check if a product's subcategory belongs to a category
  private isCategoryMatch(subCategoryId: string, categoryId: string): boolean {
    return this.subCategoryToCategory.get(subCategoryId) === categoryId;
  }

  // Format warranty text
  formatWarranty(months: number | null | undefined): string {
    if (!months) return 'No Warranty';

    if (months >= 12) {
      const years = Math.floor(months / 12);
      const remainingMonths = months % 12;

      if (remainingMonths === 0) {
        return `${years} Year${years > 1 ? 's' : ''} Warranty`;
      } else {
        return `${years} Year${years > 1 ? 's' : ''} ${remainingMonths} Month${remainingMonths > 1 ? 's' : ''} Warranty`;
      }
    } else {
      return `${months} Month${months > 1 ? 's' : ''} Warranty`;
    }
  }

  // Get shipping text
  getShippingText(shipping: ShippingTypes): string {
    switch (shipping) {
      case ShippingTypes.Free:
        return 'Free Shipping';
      case ShippingTypes.FreeINSameGovernate:
        return 'Free in Same State';
      case ShippingTypes.Paid:
        return 'Paid Shipping';
      default:
        return 'No Shipping Info';
    }
  }
}
