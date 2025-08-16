import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NestedCategoryDropdown } from '../../category/nested-category-dropdown/nested-category-dropdown';
import { SupplierService } from '../../../services/supplier.service';
import { ShippingTypes } from '../../../models/i-product';

@Component({
  selector: 'app-supplier-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule, NestedCategoryDropdown],
  templateUrl: './supplier-sidebar.html',
  styleUrl: './supplier-sidebar.css'
})
export class SupplierSidebar implements OnChanges, OnInit {
  @Input() cities: string[] = [];
  @Input() states: string[] = [];
  @Output() filterChange = new EventEmitter<any>();
  @Output() categorySelected = new EventEmitter<string>();
  @Output() subCategorySelected = new EventEmitter<string>();

  // Filter state
  selectedRating: number | null = null;
  selectedWarranty: string | null = null;
  selectedCity: string | null = null;
  selectedState: string | null = null;
  selectedShipping: string | null = null;

  // Dropdown states
  bestSellersOpen: boolean = false;
  newReleasesOpen: boolean = false;
  lastViewedActive: boolean = false;
  categoriesOpen: boolean = true;

  // Options
  warrantyOptions: { value: string, label: string }[] = [
    { value: 'none', label: 'No Warranty' }
  ];

  shippingOptions: { value: string, label: string }[] = [
    { value: ShippingTypes.Free.toString(), label: 'Free Shipping' },
    { value: ShippingTypes.FreeINSameGovernate.toString(), label: 'Free in Same State' },
    { value: ShippingTypes.Paid.toString(), label: 'Paid Shipping' }
  ];

  // Loading state
  loading: boolean = false;
  error: string | null = null;

  constructor(private supplierService: SupplierService) { }

  ngOnInit(): void {
    if (this.cities.length === 0) {
      this.loadCities();
    }

    if (this.states.length === 0) {
      this.loadStates();
    }

    // Load dynamic warranty options
    this.loadWarrantyOptions();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Update filter options when inputs change
    if (changes['cities'] || changes['states']) {
      // No need to emit here as this is just initializing
    }
  }

  // Load cities from API
  loadCities(): void {
    this.loading = true;
    this.supplierService.getAllCities().subscribe({
      next: (cities) => {
        this.cities = cities;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading cities:', error);
        this.error = 'Failed to load cities';
        this.loading = false;
      }
    });
  }

  // Load states from API
  loadStates(): void {
    this.loading = true;
    this.supplierService.getAllStates().subscribe({
      next: (states) => {
        this.states = states;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading states:', error);
        this.error = 'Failed to load states';
        this.loading = false;
      }
    });
  }

  // Load warranty options from API
  loadWarrantyOptions(): void {
    this.loading = true;
    this.supplierService.getWarrantyOptions().subscribe({
      next: (options) => {
        this.warrantyOptions = options;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading warranty options:', error);
        this.error = 'Failed to load warranty options';
        this.loading = false;
      }
    });
  }

  // Handle category selection from nested dropdown
  onCategorySelected(categoryId: string): void {
    this.categorySelected.emit(categoryId);
    this.emitFilterChange();
  }

  // Handle subcategory selection from nested dropdown
  onSubCategorySelected(subCategoryId: string): void {
    this.subCategorySelected.emit(subCategoryId);
    this.emitFilterChange();
  }

  // Toggle dropdown states
  toggleCategories(): void {
    this.categoriesOpen = !this.categoriesOpen;
  }

  // Filter by rating
  setRatingFilter(rating: number | null): void {
    this.selectedRating = rating;
    this.emitFilterChange();
  }

  // Filter by warranty
  setWarrantyFilter(warranty: string | null): void {
    this.selectedWarranty = warranty;
    this.emitFilterChange();
  }

  // Filter by city
  setCityFilter(city: string | null): void {
    this.selectedCity = city;
    this.emitFilterChange();
  }

  // Filter by state
  setStateFilter(state: string | null): void {
    this.selectedState = state;
    this.emitFilterChange();
  }

  // Filter by shipping
  setShippingFilter(shipping: string | null): void {
    this.selectedShipping = shipping;
    this.emitFilterChange();
  }

  // Toggle dropdown states
  toggleBestSellers(): void {
    this.bestSellersOpen = !this.bestSellersOpen;
  }

  toggleNewReleases(): void {
    this.newReleasesOpen = !this.newReleasesOpen;
  }

  toggleLastViewed(): void {
    this.lastViewedActive = !this.lastViewedActive;
    this.emitFilterChange();
  }

  // Reset all filters
  resetFilters(): void {
    this.selectedRating = null;
    this.selectedWarranty = null;
    this.selectedCity = null;
    this.selectedState = null;
    this.selectedShipping = null;
    this.lastViewedActive = false;

    // Reset category selection by emitting null
    this.categorySelected.emit();
    this.subCategorySelected.emit();

    this.emitFilterChange();
  }

  // Emit all filter changes to parent component
  emitFilterChange(): void {
    this.filterChange.emit({
      rating: this.selectedRating,
      warranty: this.selectedWarranty,
      city: this.selectedCity,
      state: this.selectedState,
      shipping: this.selectedShipping,
      lastViewedActive: this.lastViewedActive
    });
  }
}
