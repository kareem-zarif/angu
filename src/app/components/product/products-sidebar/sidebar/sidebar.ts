import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Rating } from '../../../rating/rating/rating';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule, Rating],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class Sidebar implements OnChanges {
  @Input() minPrice: number = 8;
  @Input() maxPrice: number = 108;
  @Output() filterChange = new EventEmitter<any>();

  // Filter states
  selectedRating: number | null = null;
  priceRange: [number, number] = [8, 108];
  includeOutOfStock: boolean = false;

  // Supplier checkboxes
  suppliers = [
    { name: 'Max Factory', checked: false },
    { name: 'لوازم مصنع البلاستيك', checked: false }
  ];

  // Dropdown states
  bestSellersOpen: boolean = false;
  newReleasesOpen: boolean = false;
  lastViewedActive: boolean = false;

  constructor() { }

  ngOnChanges(changes: SimpleChanges): void {
    // Update price range when min/max inputs change
    if (changes['minPrice'] || changes['maxPrice']) {
      this.priceRange = [this.minPrice, this.maxPrice];
      // No need to emit here as this is just initializing from parent
    }
  }

  // Filter by rating
  setRatingFilter(rating: number | null) {
    this.selectedRating = rating;
    this.emitFilterChange();
  }

  // Update price range
  updatePriceRange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.priceRange[1] = parseInt(value);
    this.emitFilterChange();
  }

  // Toggle supplier selection
  toggleSupplier(index: number) {
    this.suppliers[index].checked = !this.suppliers[index].checked;
    this.emitFilterChange();
  }

  // Toggle out of stock products
  toggleOutOfStock() {
    this.includeOutOfStock = !this.includeOutOfStock;
    this.emitFilterChange();
  }

  // Toggle dropdown states
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

  // Emit all filter changes to parent component
  emitFilterChange() {
    this.filterChange.emit({
      rating: this.selectedRating,
      priceRange: this.priceRange,
      suppliers: this.suppliers.filter(s => s.checked).map(s => s.name),
      includeOutOfStock: this.includeOutOfStock,
      lastViewedActive: this.lastViewedActive
    });
  }
}
