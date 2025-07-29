import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminCategoriesService, Category, CategoryCreateDto, CategoryUpdateDto } from '../../services/admin-categories-service';

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-categories.html',
})
export class AdminCategoriesComponent implements OnInit {
  categories: Category[] = [];
  loading = false;

  showModal = false;
  editCategory: Category | null = null;
  form: Partial<Category> = {};
  
  // Validation properties
  formErrors: { [key: string]: string } = {};
  isSubmitting = false;

  constructor(private categoriesService: AdminCategoriesService) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories() {
    this.loading = true;
    this.categoriesService.getCategories().subscribe(res => {
      this.categories = res;
      this.loading = false;
    });
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

    // Status validation
    if (!this.form.status) {
      this.formErrors['status'] = 'Status is required';
    } else if (!['Active', 'Inactive'].includes(this.form.status)) {
      this.formErrors['status'] = 'Status must be either Active or Inactive';
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
        status: this.form.status as 'Active' | 'Inactive',
      };
      this.categoriesService.updateCategory(updateDto).subscribe({
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
        status: this.form.status as 'Active' | 'Inactive',
      };
      this.categoriesService.createCategory(createDto).subscribe({
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
      this.categoriesService.deleteCategory(category.id).subscribe({
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