import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminSubCategoriesService, SubCategory, SubCategoryCreateDto, SubCategoryUpdateDto } from '../../services/admin-subcategories-service';
import { CategoryService } from '../../services/category.service';
import { ICategory } from '../../models/i-category';
import { PaginationComponent } from '../shared/pagination/pagination';

@Component({
  selector: 'app-admin-subcategories',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './admin-subcategories.html',
  styleUrl: './admin-subcategories.css'
})
export class AdminSubCategoriesComponent implements OnInit {
  subCategories: SubCategory[] = [];
  filteredSubCategories: SubCategory[] = [];
  categories: ICategory[] = [];
  loading = false;

  showModal = false;
  editSubCategory: SubCategory | null = null;
  form: Partial<SubCategoryCreateDto> = {};
  
  // Pagination properties
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  totalPages = 1;
  
  // Search properties
  searchTerm = '';
  searchField = 'all'; // 'all', 'name', 'categoryName'
  
  // Validation properties
  formErrors: { [key: string]: string } = {};
  isSubmitting = false;

  constructor(
    private subCategoriesService: AdminSubCategoriesService,
    private categoryService: CategoryService
  ) {}

  ngOnInit(): void {
    this.loadSubCategories();
    this.loadCategories();
  }

  loadSubCategories() {
    this.loading = true;
    this.subCategoriesService.getSubCategories().subscribe({
      next: (res) => {
        this.subCategories = res;
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading subcategories:', error);
        this.loading = false;
      }
    });
  }

  loadCategories() {
    this.categoryService.getAll().subscribe({
      next: (categories) => {
        this.categories = categories;
      },
      error: (error) => {
        console.error('Error loading categories:', error);
      }
    });
  }

  applyFilters() {
    // Apply search filter
    this.filteredSubCategories = this.subCategories.filter(subCategory => {
      if (!this.searchTerm) return true;
      
      const searchLower = this.searchTerm.toLowerCase();
      
      switch (this.searchField) {
        case 'name':
          return subCategory.name.toLowerCase().includes(searchLower);
        case 'categoryName':
          return subCategory.categoryName.toLowerCase().includes(searchLower);
        case 'all':
        default:
          return (
            subCategory.name.toLowerCase().includes(searchLower) ||
            subCategory.categoryName.toLowerCase().includes(searchLower)
          );
      }
    });
    
    // Update pagination
    this.totalItems = this.filteredSubCategories.length;
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    
    // Reset to first page if current page is out of bounds
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = 1;
    }
  }

  getPaginatedSubCategories(): SubCategory[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredSubCategories.slice(startIndex, endIndex);
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
    this.currentPage = 1;
    this.applyFilters();
  }

  clearSearch() {
    this.searchTerm = '';
    this.searchField = 'all';
    this.currentPage = 1;
    this.applyFilters();
  }

  openAdd() {
    this.editSubCategory = null;
    this.form = {
      name: '',
      description: '',
      categoryId: ''
    };
    this.formErrors = {};
    this.showModal = true;
  }

  openEdit(subCategory: SubCategory) {
    this.editSubCategory = subCategory;
    this.form = {
      name: subCategory.name,
      description: '',
      categoryId: this.getCategoryIdByName(subCategory.categoryName)
    };
    this.formErrors = {};
    this.showModal = true;
  }

  getCategoryIdByName(categoryName: string): string {
    const category = this.categories.find(c => c.name === categoryName);
    return category ? category.id : '';
  }

  validateForm(): boolean {
    this.formErrors = {};

    if (!this.form.name?.trim()) {
      this.formErrors['name'] = 'Subcategory name is required';
    }

    if (!this.form.categoryId) {
      this.formErrors['categoryId'] = 'Category is required';
    }

    return Object.keys(this.formErrors).length === 0;
  }

  saveSubCategory() {
    if (!this.validateForm()) {
      return;
    }

    this.isSubmitting = true;

    if (this.editSubCategory) {
      // Update existing subcategory
      const updateData: SubCategoryUpdateDto = {
        id: this.editSubCategory.id,
        name: this.form.name!,
        description: this.form.description,
        categoryId: this.form.categoryId!
      };

      this.subCategoriesService.updateSubCategory(updateData).subscribe({
        next: () => {
          this.loadSubCategories();
          this.showModal = false;
          this.isSubmitting = false;
          alert('Subcategory updated successfully!');
        },
        error: (error) => {
          console.error('Error updating subcategory:', error);
          this.isSubmitting = false;
          alert('Failed to update subcategory. Please try again.');
        }
      });
    } else {
      // Create new subcategory
      const createData: SubCategoryCreateDto = {
        name: this.form.name!,
        description: this.form.description,
        categoryId: this.form.categoryId!
      };

      this.subCategoriesService.createSubCategory(createData).subscribe({
        next: () => {
          this.loadSubCategories();
          this.showModal = false;
          this.isSubmitting = false;
          alert('Subcategory created successfully!');
        },
        error: (error) => {
          console.error('Error creating subcategory:', error);
          this.isSubmitting = false;
          alert('Failed to create subcategory. Please try again.');
        }
      });
    }
  }

  deleteSubCategory(subCategory: SubCategory) {
    if (confirm(`Are you sure you want to delete the subcategory "${subCategory.name}"?`)) {
      this.subCategoriesService.deleteSubCategory(subCategory.id).subscribe({
        next: () => {
          this.loadSubCategories();
          alert('Subcategory deleted successfully!');
        },
        error: (error) => {
          console.error('Error deleting subcategory:', error);
          alert('Failed to delete subcategory. Please try again.');
        }
      });
    }
  }

  clearError(field: string) {
    if (this.formErrors[field]) {
      delete this.formErrors[field];
    }
  }

  getProductCount(subCategory: SubCategory): number {
    return subCategory.products ? subCategory.products.length : 0;
  }
}

