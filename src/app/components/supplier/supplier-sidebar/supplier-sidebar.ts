import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Rating } from '../../rating/rating/rating';

@Component({
  selector: 'app-supplier-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule, Rating],
  templateUrl: './supplier-sidebar.html',
  styleUrl: './supplier-sidebar.css'
})
export class SupplierSidebar implements OnChanges {
  @Input() cities: string[] = [];
  @Input() governorates: string[] = [];
  @Output() filterChange = new EventEmitter<any>();

  // Filter states
  selectedRating: number | null = null;
  selectedWarranty: string | null = null;
  selectedCity: string | null = null;
  selectedGovernorate: string | null = null;
  selectedShipping: string | null = null;

  // Dropdown states
  bestSellersOpen: boolean = false;
  newReleasesOpen: boolean = false;
  lastViewedActive: boolean = false;

  // Warranty options
  warrantyOptions = [
    { value: '14', label: '14 Days' },
    { value: '30', label: '1 Month' },
    { value: '90', label: '3 Months' },
    { value: '365', label: '1 Year' },
    { value: 'none', label: 'None' }
  ];

  // Shipping options
  shippingOptions = [
    { value: 'Free', label: 'Free Shipping' },
    { value: 'FreeINSameGovernate', label: 'Free in Same Governate' },
    { value: 'Paid', label: 'Paid Shipping' }
  ];

  constructor() { }

  ngOnChanges(changes: SimpleChanges): void {
    // Update filter options when inputs change
    if (changes['cities'] || changes['governorates']) {
      // No need to emit here as this is just initializing
    }
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

  // Filter by governorate
  setGovernorateFilter(governorate: string | null): void {
    this.selectedGovernorate = governorate;
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
    this.selectedGovernorate = null;
    this.selectedShipping = null;
    this.lastViewedActive = false;
    this.emitFilterChange();
  }

  // Emit all filter changes to parent component
  emitFilterChange(): void {
    this.filterChange.emit({
      rating: this.selectedRating,
      warranty: this.selectedWarranty,
      city: this.selectedCity,
      governorate: this.selectedGovernorate,
      shipping: this.selectedShipping,
      lastViewedActive: this.lastViewedActive
    });
  }
}
