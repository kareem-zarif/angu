import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminCategoriesService, Category, CategoryCreateDto, CategoryUpdateDto } from '../../services/admin-categories-service';
import { PaginationComponent } from '../shared/pagination/pagination';

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './admin-categories.html',
})
export class AdminCategoriesComponent implements OnInit {
  categories: Category[] = [];
  filteredCategories: Category[] = [];
  loading = false;

  showModal = false;
  editCategory: Category | null = null;
  form: Partial<Category> = {};
  
  // Pagination properties
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  totalPages = 1;
  
  // Search properties
  searchTerm = '';
  searchField = 'all'; // 'all', 'name', 'description'
  
  // Validation properties
  formErrors: { [key: string]: string } = {};
  isSubmitting = false;

  constructor(private adminCategoriesService: AdminCategoriesService) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories() {
    this.loading = true;
    this.adminCategoriesService.getCategories().subscribe(res => {
      this.categories = res;
      // Load subcategories count for each category
      this.loadSubcategoriesCount();
    });
  }

  loadSubcategoriesCount(): void {
    // Fetch all subcategories once and count them locally for better performance
    this.adminCategoriesService.getAllSubCategories().subscribe({
      next: (subcategories) => {
        // Count subcategories for each category
        this.categories.forEach(category => {
          category.subcategoriesCount = subcategories.filter(
            sub => sub.categoryName === category.name
          ).length;
        });
        // Update filters and finish loading
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading subcategories count:', error);
        // Set default count of 0 if there's an error
        this.categories.forEach(category => {
          category.subcategoriesCount = 0;
        });
        // Update filters and finish loading even on error
        this.applyFilters();
        this.loading = false;
      }
    });
  }

  applyFilters() {
    // Apply search filter
    this.filteredCategories = this.categories.filter(category => {
      if (!this.searchTerm) return true;
      
      const searchLower = this.searchTerm.toLowerCase();
      
      switch (this.searchField) {
        case 'name':
          return category.name.toLowerCase().includes(searchLower);
        case 'description':
          return category.description.toLowerCase().includes(searchLower);
        case 'all':
        default:
          return (
            category.name.toLowerCase().includes(searchLower) ||
            category.description.toLowerCase().includes(searchLower)
          );
      }
    });
    
    // Update pagination
    this.totalItems = this.filteredCategories.length;
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    
    // Reset to first page if current page is out of bounds
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = 1;
    }
  }

  getPaginatedCategories(): Category[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredCategories.slice(startIndex, endIndex);
  }

  onPageChange(page: number) {
    this.currentPage = page;
  }

  onItemsPerPageChange(itemsPerPage: number) {
    this.itemsPerPage = itemsPerPage;
    this.currentPage = 1; // Reset to first page
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
  }

  onSearch() {
    this.currentPage = 1; // Reset to first page when searching
    this.applyFilters();
  }

  clearSearch() {
    this.searchTerm = '';
    this.searchField = 'all';
    this.currentPage = 1;
    this.applyFilters();
  }

  openAdd() {
    this.editCategory = null;
    this.form = {};
    this.formErrors = {};
    this.showModal = true;
  }

  openEdit(category: Category) {
    this.editCategory = category;
    this.form = { ...category };
    this.formErrors = {};
    this.showModal = true;
  }

  validateForm(): boolean {
    this.formErrors = {};

    // Name validation
    if (!this.form.name || this.form.name.trim() === '') {
      this.formErrors['name'] = 'Name is required';
    } else if (this.form.name.trim().length < 2) {
      this.formErrors['name'] = 'Name must be at least 2 characters long';
    } else if (this.form.name.trim().length > 50) {
      this.formErrors['name'] = 'Name cannot exceed 50 characters';
    }

    // Description validation
    if (!this.form.description || this.form.description.trim() === '') {
      this.formErrors['description'] = 'Description is required';
    } else if (this.form.description.trim().length < 10) {
      this.formErrors['description'] = 'Description must be at least 10 characters long';
    } else if (this.form.description.trim().length > 500) {
      this.formErrors['description'] = 'Description cannot exceed 500 characters';
    }

    return Object.keys(this.formErrors).length === 0;
  }

  saveCategory() {
    if (!this.validateForm()) {
      return;
    }

    this.isSubmitting = true;

    if (this.editCategory) {
      // Update
      const updateDto: CategoryUpdateDto = {
        id: this.editCategory.id,
        name: this.form.name!.trim(),
        description: this.form.description!.trim(),
      };
      this.adminCategoriesService.updateCategory(updateDto).subscribe({
        next: () => {
          this.showModal = false;
          this.loadCategories();
          this.isSubmitting = false;
        },
        error: (error) => {
          console.error('Error updating category:', error);
          this.formErrors['general'] = 'Failed to update category. Please try again.';
          this.isSubmitting = false;
        }
      });
    } else {
      // Create
      const createDto: CategoryCreateDto = {
        name: this.form.name!.trim(),
        description: this.form.description!.trim(),
      };
      this.adminCategoriesService.createCategory(createDto).subscribe({
        next: () => {
          this.showModal = false;
          this.loadCategories();
          this.isSubmitting = false;
        },
        error: (error) => {
          console.error('Error creating category:', error);
          this.formErrors['general'] = 'Failed to create category. Please try again.';
          this.isSubmitting = false;
        }
      });
    }
  }

  deleteCategory(category: Category) {
    if (confirm(`Are you sure you want to delete the category "${category.name}"?`)) {
      this.adminCategoriesService.deleteCategory(category.id).subscribe({
        next: () => {
          this.loadCategories();
        },
        error: (error) => {
          console.error('Error deleting category:', error);
          alert('Failed to delete category. Please try again.');
        }
      });
    }
  }

  clearError(field: string) {
    if (this.formErrors[field]) {
      delete this.formErrors[field];
    }
  }
} 