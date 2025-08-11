import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface Category {
  id: string;
  name: string;
  description: string;
  subcategoriesCount?: number;
}

export interface CategoryCreateDto {
  name: string;
  description: string;
}

export interface CategoryUpdateDto {
  id: string;
  name: string;
  description: string;
}

// Interface for subcategory response from backend
export interface SubCategoryResDto {
  id: string;
  name: string;
  categoryName: string;
  products: any[];
}

@Injectable({ providedIn: 'root' })
export class AdminCategoriesService {
  private apiUrl = 'https://localhost:7253/api/Category';
  private subCategoriesApiUrl = 'https://localhost:7253/api/SubCategory';

  constructor(private http: HttpClient) {}

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(this.apiUrl).pipe(
      map(categories => {
        // For now, we'll set a default count of 0
        // In a real implementation, you might want to fetch this from the backend
        return categories.map(category => ({
          ...category,
          subcategoriesCount: 0
        }));
      })
    );
  }

  getCategoryById(id: string): Observable<Category> {
    return this.http.get<Category>(`${this.apiUrl}/${id}`);
  }

  createCategory(category: CategoryCreateDto): Observable<Category> {
    return this.http.post<Category>(this.apiUrl, category);
  }

  updateCategory(category: CategoryUpdateDto): Observable<Category> {
    return this.http.put<Category>(this.apiUrl, category);
  }

  deleteCategory(id: string): Observable<Category> {
    return this.http.delete<Category>(`${this.apiUrl}/${id}`);
  }

  // Method to get subcategories count for a specific category
  // Using the actual available backend endpoint: GetSubCategories()
  getSubcategoriesCountByCategoryId(categoryId: string, categoryName: string): Observable<number> {
    return this.http.get<SubCategoryResDto[]>(this.subCategoriesApiUrl).pipe(
      map(subcategories => {
        // Filter subcategories by category name and count them
        return subcategories.filter(sub => sub.categoryName === categoryName).length;
      })
    );
  }

  // Method to get all subcategories (for bulk counting)
  getAllSubCategories(): Observable<SubCategoryResDto[]> {
    return this.http.get<SubCategoryResDto[]>(this.subCategoriesApiUrl);
  }
} 