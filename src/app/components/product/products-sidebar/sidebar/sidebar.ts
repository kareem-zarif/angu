import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IProduct } from '../../../../models/i-product';
import { CategoryService } from '../../../../services/category.service';
import { SubCategoryService } from '../../../../services/sub-category.service';
import { NestedCategoryDropdown } from '../../../category/nested-category-dropdown/nested-category-dropdown';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule, NestedCategoryDropdown, RouterModule,TranslateModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class Sidebar implements OnChanges, OnInit {
  @Input() minPrice: number = 8;
  @Input() maxPrice: number = 108;
  @Output() filterChange = new EventEmitter<any>();
  @Output() categorySelected = new EventEmitter<string>();
  @Output() subCategorySelected = new EventEmitter<string>();
  @Input() products: IProduct[] = [];
  filteredProducts: IProduct[] = [];
  // Filter states
  selectedRating: number | null = null;
  priceRange: [number, number] = [8, 108];
  includeOutOfStock: boolean = false;

  // Supplier checkboxes
  suppliers: { name: string, checked: boolean }[] = [];

  // Dropdown states
  bestSellersOpen: boolean = false;
  newReleasesOpen: boolean = false;
  lastViewedActive: boolean = false;
  categoriesOpen: boolean = true;
  tooltipVisible = false;


  // Loading state
  loading: boolean = false;
  error: string | null = null;

  // Add new property to track filtered products from other filters
  // @Input() filteredProductsFromOtherFilters: IProduct[] = [];

  constructor(
    private categoryService: CategoryService,
    private subCategoryService: SubCategoryService
  ) { }

  ngOnInit(): void {
    this.updateSuppliersList();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Update price range when min/max inputs change - but only if not already set by user
    if ((changes['minPrice'] || changes['maxPrice']) && this.priceRange[1] === 108) {
      this.priceRange = [this.minPrice, this.maxPrice];
      // No need to emit here as this is just initializing from parent
    }

    // Update suppliers list when products change
    if (changes['products'] && this.products) {
      this.updateSuppliersList();
    }

    // if (changes['filteredProductsFromOtherFilters']) {
    //   this.updateSuppliersList();
    // }
  }

  // Handle category selection from nested dropdown
  onCategorySelected(categoryId: string): void {
    // Reset subcategory selection when category changes
    this.subCategorySelected.emit();
    this.categorySelected.emit(categoryId);
    this.emitFilterChange();
  }

  // Handle subcategory selection from nested dropdown
  onSubCategorySelected(subCategoryId: string): void {
    this.subCategorySelected.emit(subCategoryId);
    // Don't emit category selected here as it's handled by the product-list component
    this.emitFilterChange();
  }

  // Filter by rating
  setRatingFilter(rating: number | null): void {
    // Toggle rating if clicking the same one
    if (this.selectedRating === rating) {
      this.selectedRating = null;
    } else {
      this.selectedRating = rating;
    }

    // Emit filter change with forceRefresh
    this.filterChange.emit({
      rating: this.selectedRating,
      suppliers: this.suppliers.filter(s => s.checked).map(s => s.name),
      includeOutOfStock: this.includeOutOfStock,
      lastViewedActive: this.lastViewedActive,
      priceRange: this.priceRange,
      forceRefresh: true // Add this to force refresh
    });
  }

  // Update price range
  updatePriceRange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.priceRange[1] = parseInt(value);

    // Don't filter products here - just emit the filter change
    // Let the parent component handle all filtering
    this.emitFilterChange();
  }

  // Toggle supplier selection
  toggleSupplier(index: number) {
    this.suppliers[index].checked = !this.suppliers[index].checked;
    // Don't filter products here - just emit the filter change
    this.emitFilterChange();
  }

  // Toggle out of stock products
  toggleOutOfStock() {
    this.includeOutOfStock = !this.includeOutOfStock;
    this.emitFilterChange();
  }

  // Toggle dropdown states
  toggleCategories() {
    this.categoriesOpen = !this.categoriesOpen;
  }

  toggleBestSellers() {
    this.bestSellersOpen = !this.bestSellersOpen;
  }

  toggleNewReleases() {
    this.newReleasesOpen = !this.newReleasesOpen;
  }

  toggleLastViewed() {
    this.lastViewedActive = !this.lastViewedActive;
    this.emitFilterChange();
  }

  // Reset all filters
  resetFilters(): void {
    // Reset all filter states
    this.selectedRating = null;
    this.priceRange = [this.minPrice, this.maxPrice];
    this.suppliers.forEach(s => s.checked = false);
    this.includeOutOfStock = false;
    this.lastViewedActive = false;
    this.categoriesOpen = true;
    this.bestSellersOpen = false;
    this.newReleasesOpen = false;

    // Reset category selection
    this.categorySelected.emit();
    this.subCategorySelected.emit();

    // Emit reset filter state
    this.filterChange.emit({
      rating: null,
      suppliers: [],
      includeOutOfStock: false,
      lastViewedActive: false,
      priceRange: [this.minPrice, this.maxPrice],
      forceRefresh: true
    });
  }

  // Emit all filter changes to parent component
  emitFilterChange() {
    const filterData = {
      rating: this.selectedRating,
      suppliers: this.suppliers.filter(s => s.checked).map(s => s.name),
      includeOutOfStock: this.includeOutOfStock,
      lastViewedActive: this.lastViewedActive,
      priceRange: this.priceRange,
      // Don't include filteredProducts - let parent handle filtering
    };
    
    this.filterChange.emit(filterData);
  }

  // Update suppliers list to only include suppliers of current products
  // Preserve the checked state of previously selected suppliers
  updateSuppliersList(): void {
    // Get unique supplier names only from currently filtered products
    const uniqueSupplierNames = new Set<string>();

    // Use filteredProductsFromOtherFilters if available, otherwise use all products
    const productsToFilter = this.products;

    productsToFilter.forEach(product => {
      if (product.supplierNames?.length) {
        product.supplierNames.forEach(name => uniqueSupplierNames.add(name));
      }
      if (product.suppliers?.length) {
        product.suppliers.forEach(name => uniqueSupplierNames.add(name));
      }
    });

    // Preserve checked state while updating supplier list
    this.suppliers = Array.from(uniqueSupplierNames)
      .sort((a, b) => a.localeCompare(b))
      .map(name => ({
        name,
        checked: this.suppliers.find(s => s.name === name)?.checked || false
      }));

    // Don't filter products here - just update the supplier list
    // The parent component will handle filtering when needed
  }
}
