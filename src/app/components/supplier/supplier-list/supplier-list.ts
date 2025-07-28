import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { ISupplier } from '../../../models/i-supplier';
import { IProduct } from '../../../models/i-product';
import { SupplierService } from '../../../services/supplier.service';
import { CartService } from '../../../services/cart.service';
import { Rating } from '../../rating/rating/rating';
import { SupplierSidebar } from '../supplier-sidebar/supplier-sidebar';
import { Categories } from '../../product/category-list/categories/categories';
import { Pagination } from '../../pagination/pagination';

@Component({
  selector: 'app-supplier-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    Rating,
    SupplierSidebar,
    Categories,
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
  supplierProducts: { [key: string]: IProduct[] } = {};

  // Filter states
  selectedCategory: string | null = null;
  selectedRating: number | null = null;
  selectedWarranty: string | null = null;
  selectedCity: string | null = null;
  selectedGovernorate: string | null = null;
  selectedShipping: string | null = null;

  // Location data
  cities: string[] = [];
  governorates: string[] = [];

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 8;

  private subscription: Subscription | null = null;

  constructor(
    private supplierService: SupplierService,
    private cartService: CartService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Load suppliers
    this.allSuppliers = this.supplierService.getAllSuppliers();

    // Load location data
    this.cities = this.supplierService.getAllCities();
    this.governorates = this.supplierService.getAllGovernorates();

    // Load products for each supplier
    this.allSuppliers.forEach(supplier => {
      this.supplierProducts[supplier.id] = this.supplierService.getSupplierProducts(supplier.id);
    });

    // Initialize filtered and displayed suppliers
    this.filteredSuppliers = [...this.allSuppliers];
    this.updateDisplayedSuppliers();
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  // Handle category selection
  onCategorySelected(categoryId: string): void {
    this.selectedCategory = categoryId;
    this.applyFilters();
  }

  // Handle filter changes from sidebar
  onFilterChange(filters: any): void {
    this.selectedRating = filters.rating;
    this.selectedWarranty = filters.warranty;
    this.selectedCity = filters.city;
    this.selectedGovernorate = filters.governorate;
    this.selectedShipping = filters.shipping;
    this.applyFilters();
  }

  // Apply all filters
  applyFilters(): void {
    this.filteredSuppliers = this.allSuppliers.filter(supplier => {
      // Filter by city
      if (this.selectedCity && supplier.City !== this.selectedCity) {
        return false;
      }

      // Filter by governorate
      if (this.selectedGovernorate && supplier.Governmate !== this.selectedGovernorate) {
        return false;
      }

      // Get supplier products for further filtering
      const products = this.supplierProducts[supplier.id] || [];

      // Filter by category
      if (this.selectedCategory && !products.some(p => p.subCategoryId === this.selectedCategory)) {
        return false;
      }

      // Filter by rating (assuming average rating of products)
      if (this.selectedRating !== null) {
        const avgRating = this.getAverageRating(products);
        if (avgRating < this.selectedRating) {
          return false;
        }
      }

      // Filter by warranty
      if (this.selectedWarranty) {
        if (this.selectedWarranty === 'none') {
          // Check if all products have no warranty
          if (!products.every(p => !p.warrantyNMonths)) {
            return false;
          }
        } else {
          // Convert warranty value to number
          const warrantyMonths = parseInt(this.selectedWarranty);
          // Check if any product has the specified warranty
          if (!products.some(p => p.warrantyNMonths === warrantyMonths)) {
            return false;
          }
        }
      }

      // Filter by shipping
      if (this.selectedShipping && !products.some(p => p.shipping === this.selectedShipping)) {
        return false;
      }

      return true;
    });

    // Reset to first page when filters change
    this.currentPage = 1;
    this.updateDisplayedSuppliers();
  }

  // Update displayed suppliers based on current page
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
  navigateToProductDetails(product: IProduct, event: Event): void {
    // Prevent navigation if the click was on a button
    if ((event.target as HTMLElement).closest('button')) {
      return;
    }

    this.router.navigate(['/products', product.id]);
  }

  // Add product to cart
  addToCart(product: IProduct): void {
    this.cartService.addToCart(product, 1);
    this.router.navigate(['/cart']);
  }

  // Get average rating for a supplier's products
  getAverageRating(products: IProduct[]): number {
    if (!products.length) return 0;

    const totalRating = products.reduce((sum, product) => {
      return sum + (product.rating || 0);
    }, 0);

    return totalRating / products.length;
  }

  // Get top products for a supplier (limited to 3)
  getTopProducts(supplierId: string): IProduct[] {
    const products = this.supplierProducts[supplierId] || [];
    return products.slice(0, 3);
  }

  // Add method to navigate to products filtered by supplier
  viewSupplierProducts(supplierName: string): void {
    this.router.navigate(['/products'], {
      queryParams: { supplier: supplierName }
    });
  }
}
