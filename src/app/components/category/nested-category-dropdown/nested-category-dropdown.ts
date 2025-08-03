import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoryService } from '../../../services/category.service';
import { ICategory } from '../../../models/i-category';
import { ISubCategory } from '../../../models/i-sub-category';
import { forkJoin, of, catchError, map } from 'rxjs';
import { SubCategoryService } from '../../../services/sub-category.service';

@Component({
  selector: 'app-nested-category-dropdown',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './nested-category-dropdown.html',
  styleUrl: './nested-category-dropdown.css'
})
export class NestedCategoryDropdown implements OnInit {
  @Output() categorySelected = new EventEmitter<string>();
  @Output() subCategorySelected = new EventEmitter<string>();

  categories: ICategory[] = [];
  subCategoriesByCategory: { [categoryId: string]: ISubCategory[] } = {};

  selectedCategoryId: string | null = null;
  selectedSubCategoryId: string | null = null;

  loading: boolean = true;
  error: string | null = null;

  // UI state
  expandedCategoryId: string | null = null;

  constructor(
    private categoryService: CategoryService,
    private subCategoryService: SubCategoryService
  ) {
    console.log('NestedCategoryDropdown initialized'); // Debug log
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.error = null;

    // First load categories
    this.categoryService.getAll().subscribe({
      next: (categories) => {
        console.log('Categories loaded:', categories); // Debug log
        this.categories = categories;

        // Then load subcategories after categories are loaded
        if (categories.length > 0) {
          this.subCategoryService.getAll().subscribe({
            next: (subCategories) => {
              console.log('Subcategories loaded:', subCategories); // Debug log

              // Group subcategories by category ID
              this.subCategoriesByCategory = subCategories.reduce((acc, subCat) => {
                if (!acc[subCat.categoryId]) {
                  acc[subCat.categoryId] = [];
                }
                acc[subCat.categoryId].push(subCat);
                return acc;
              }, {} as { [key: string]: ISubCategory[] });

              this.loading = false;
            },
            error: (err) => {
              console.error('Error loading subcategories:', err);
              this.error = 'Failed to load subcategories';
              this.loading = false;
            }
          });
        } else {
          this.loading = false;
        }
      },
      error: (err) => {
        console.error('Error loading categories:', err);
        this.error = 'Failed to load categories';
        this.loading = false;
      }
    });
  }

  // Update loadSubCategories to prevent multiple loads
  loadSubCategories(): void {
    if (this.loading) return; // Prevent multiple simultaneous loads

    this.loading = true;
    this.error = null;

    this.subCategoryService.getAll().subscribe({
      next: (subCategories) => {
        // Group subcategories by category ID
        this.subCategoriesByCategory = subCategories.reduce((acc, subCat) => {
          if (!acc[subCat.categoryId]) {
            acc[subCat.categoryId] = [];
          }
          // Only add if not already present
          if (!acc[subCat.categoryId].find(sc => sc.id === subCat.id)) {
            acc[subCat.categoryId].push(subCat);
          }
          return acc;
        }, {} as { [key: string]: ISubCategory[] });

        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading subcategories:', err);
        this.error = 'Failed to load subcategories';
        this.loading = false;
      }
    });
  }

  // Handle category name click - ONLY for filtering
  onCategoryNameClick(categoryId: string, event: Event): void {
    // Stop event propagation to prevent container click
    event.stopPropagation();

    this.selectedCategoryId = categoryId;
    this.selectedSubCategoryId = null;
    this.categorySelected.emit(categoryId);
  }

  // Add method to force expand category
  expandCategory(categoryId: string): void {
    this.expandedCategoryId = categoryId;
  }

  // Modify click handler to always show subcategories
  onCategoryContainerClick(categoryId: string): void {
    // If already expanded, collapse it
    if (this.expandedCategoryId === categoryId) {
      this.expandedCategoryId = null;
      return;
    }

    // If subcategories aren't loaded yet, load them
    if (!this.subCategoriesByCategory[categoryId]) {
      this.loadSubCategories();
    }

    // Set the expanded category
    this.expandedCategoryId = categoryId;
  }

  // Handle subcategory click - for filtering
  onSubCategoryClick(subCategoryId: string, event: Event): void {
    // Stop event propagation
    event.stopPropagation();

    this.selectedSubCategoryId = subCategoryId;
    this.subCategorySelected.emit(subCategoryId);
  }

  clearSelection(event: Event): void {
    // Stop event propagation
    event.stopPropagation();

    this.selectedCategoryId = null;
    this.selectedSubCategoryId = null;
    this.expandedCategoryId = null;
    this.categorySelected.emit();
    this.subCategorySelected.emit();
  }

  // Get subcategories for the expanded category
  get filteredSubCategories(): ISubCategory[] {
    if (!this.expandedCategoryId) return [];
    return this.subCategoriesByCategory[this.expandedCategoryId] || [];
  }

  // Check if a category has subcategories
  hasSubCategories(categoryId: string): boolean {
    return (this.subCategoriesByCategory[categoryId]?.length || 0) > 0;
  }
}
