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
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-supplier-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    Rating,
    SupplierSidebar,
    Pagination,
    TranslateModule
  ],
  templateUrl: './supplier-list.html',
  styleUrl: './supplier-list.css'
})
export class SupplierList implements OnInit, OnDestroy {
  allSuppliers: ISupplier[] = [];
  filteredSuppliers: ISupplier[] = [];
  displayedSuppliers: ISupplier[] = [];

  selectedCategory: string | null = null;
  selectedSubCategory: string | null = null;
  selectedRating: number | null = null;
  selectedWarranty: string | null = null;
  selectedCity: string | null = null;
  selectedState: string | null = null;
  selectedShipping: string | null = null;

  cities: string[] = [];
  states: string[] = [];

  currentPage: number = 1;
  itemsPerPage: number = 8;

  loading: boolean = false;
  error: string | null = null;

  private subCategoryToCategory: Map<string, string> = new Map();

  currentUserId: string | undefined = undefined;

  private subscription: Subscription | null = null;
  private authSubscription: Subscription | null = null;

  toastMessage: string | null = null;

  constructor(
    private supplierService: SupplierService,
    private subCategoryService: SubCategoryService,
    private cartService: CartService,
    private wishlistService: WishlistService,
    private router: Router,
    private _auth: Auth
  ) { }

  ngOnInit(): void {
    // الاشتراك في المستخدم الحالي
    this.authSubscription = this._auth.currentUser$.subscribe(user => {
      this.currentUserId = user?.UserId;
    });

    this.loadSubCategoryMapping();
    this.loadSuppliers();

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
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  loadSubCategoryMapping(): void {
    this.subCategoryService.getAll().subscribe({
      next: (subCategories) => {
        subCategories.forEach(sc => {
          this.subCategoryToCategory.set(sc.id, sc.categoryName);
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

  onCategorySelected(categoryId: string | null): void {
    this.selectedCategory = categoryId;
    this.selectedSubCategory = null;
    this.applyFilters();
  }

  onSubCategorySelected(subCategoryId: string | null): void {
    this.selectedSubCategory = subCategoryId;
    if (subCategoryId && this.subCategoryToCategory.has(subCategoryId)) {
      this.selectedCategory = this.subCategoryToCategory.get(subCategoryId) || null;
    }
    this.applyFilters();
  }

  onFilterChange(filters: any): void {
    this.selectedRating = filters.rating;
    this.selectedWarranty = filters.warranty;
    this.selectedCity = filters.city;
    this.selectedState = filters.state;
    this.selectedShipping = filters.shipping;
    this.applyFilters();
  }

  applyFilters(): void {
    this.supplierService.searchSuppliers(null, {
      city: this.selectedCity || undefined,
      state: this.selectedState || undefined,
      rating: this.selectedRating || undefined,
      warranty: this.selectedWarranty || undefined,
      shipping: this.selectedShipping || undefined
    }).subscribe(suppliers => {
      this.filteredSuppliers = suppliers.filter(supplier => {
        const products = supplier.products || [];

        if (this.selectedSubCategory && !products.some(p => p.subCategoryId === this.selectedSubCategory)) {
          return false;
        }

        if (!this.selectedSubCategory && this.selectedCategory &&
          !products.some(p => this.isCategoryMatch(p.subCategoryId, this.selectedCategory!))) {
          return false;
        }

        return true;
      });

      this.currentPage = 1;
      this.updateDisplayedSuppliers();
    });
  }

  updateDisplayedSuppliers(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.displayedSuppliers = this.filteredSuppliers.slice(startIndex, endIndex);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.updateDisplayedSuppliers();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  navigateToProductDetails(productId: string, event: Event): void {
    event.stopPropagation();
    this.router.navigate(['/products', productId]);
  }

  requestSample(product: IProduct, event: Event): void {
    event.stopPropagation();
    this.cartService.addToCart(product, undefined, this.currentUserId);
    this.showToast(`تمت إضافة ${product.name} إلى السلة`);
  }

  toggleWishlist(product: IProduct, event: Event): void {
    event.stopPropagation();

    if (this.isInWishlist(product.id)) {
      this.wishlistService.removeFromWishlist(product.id);
      this.showToast(`تمت إزالة ${product.name} من المفضلة`);
    } else {
      this.wishlistService.addToWishlist(product, this.currentUserId);
      this.showToast(`تمت إضافة ${product.name} إلى المفضلة`);
    }
  }

  isInWishlist(productId: string): boolean {
    return this.wishlistService.isInWishlist(productId);
  }

  showToast(message: string): void {
    this.toastMessage = message;
    setTimeout(() => {
      this.toastMessage = null;
    }, 3000);
  }

  addToCart(product: IProduct): void {
    this.cartService.addToCart(product, undefined, this.currentUserId);
  }

  getTopProducts(supplier: ISupplier): IProduct[] {
    if (!supplier.products || supplier.products.length === 0) return [];
    return [...supplier.products.filter(x => x.approvalStatus === 2)]
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 3);
  }

  viewSupplierProducts(supplierName: string): void {
    this.router.navigate(['/products'], {
      queryParams: {
        supplier: supplierName,
        supplierName: supplierName
      }
    });
  }

  private isCategoryMatch(subCategoryId: string, categoryId: string): boolean {
    return this.subCategoryToCategory.get(subCategoryId) === categoryId;
  }

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

  navigateToChat(supplierId: string, event?: Event): void {
    if (event) event.stopPropagation();
    this.router.navigate(['/chat/signalr', supplierId]);
  }
}
