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
  imports: [CommonModule, FormsModule],
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
  ) { }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.error = null;

    // Load categories
    this.categoryService.getAll().subscribe({
      next: (categories) => {
        this.categories = categories;

        // Load subcategories for each category
        if (categories.length > 0) {
          this.loadSubCategories();
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

  loadSubCategories(): void {
    this.loading = true;

    // Load subcategories for ALL categories
    const requests = this.categories.map(category =>
      this.subCategoryService.getByCategoryId(category.id).pipe(
        map(subcategories => ({ categoryId: category.id, subcategories })),
        catchError(error => {
          console.error(`Error loading subcategories for ${category.id}:`, error);
          return of({ categoryId: category.id, subcategories: [] });
        })
      )
    );

    forkJoin(requests).subscribe({
      next: (results) => {
        // Map subcategories to their categories
        results.forEach(result => {
          this.subCategoriesByCategory[result.categoryId] = result.subcategories;
        });
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
    // Always try to load subcategories if not already loaded
    if (!this.subCategoriesByCategory[categoryId]) {
      this.loadSubCategories();
    }

    this.expandedCategoryId = this.expandedCategoryId === categoryId ? null : categoryId;
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
