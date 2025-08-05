import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ISubCategory } from '../models/i-sub-category';

@Injectable({
  providedIn: 'root'
})
export class SubCategoryService {
  private _baseUrl = 'https://localhost:7253/api/SubCategory';

  // Cache for subcategories by category ID
  private subCategoriesCache: { [categoryId: string]: ISubCategory[] } = {};
  private allSubCategoriesCache: ISubCategory[] = [];

  constructor(private http: HttpClient) { }

  // Get all subcategories
  getAll(): Observable<ISubCategory[]> {
    // If we have cached all subcategories, return them
    if (this.allSubCategoriesCache.length > 0) {
      return of(this.allSubCategoriesCache);
    }

    return this.http.get<ISubCategory[]>(`${this._baseUrl}`).pipe(
      map(subCategories => {
        this.allSubCategoriesCache = subCategories;

        // Also populate category-specific cache
        subCategories.forEach(sc => {
          if (!this.subCategoriesCache[sc.categoryId]) {
            this.subCategoriesCache[sc.categoryId] = [];
          }
          this.subCategoriesCache[sc.categoryId].push(sc);
        });

        return subCategories;
      }),
      catchError(error => {
        console.error('Error fetching subcategories:', error);
        return of([]);
      })
    );
  }

  // Get subcategory by ID
  getById(id: string): Observable<ISubCategory> {
    // Check cache first
    const cachedSubCategory = this.allSubCategoriesCache.find(sc => sc.id === id);
    if (cachedSubCategory) {
      return of(cachedSubCategory);
    }

    return this.http.get<ISubCategory>(`${this._baseUrl}/${id}`).pipe(
      map(subCategory => {
        // Update cache with the fetched subcategory
        this.allSubCategoriesCache.push(subCategory);
        return subCategory;
      }),
      catchError(error => {
        console.error(`Error fetching subcategory with ID ${id}:`, error);
        return throwError(() => new Error(`Subcategory with ID ${id} not found`));
      })
    );
  }

  // Get subcategories by category ID - simplified to use cache when possible
  getByCategoryId(categoryId: string): Observable<ISubCategory[]> {
    // Check if we have this category's subcategories cached
    if (this.subCategoriesCache[categoryId]) {
      return of(this.subCategoriesCache[categoryId]);
    }

    // If all subcategories are cached, filter them
    if (this.allSubCategoriesCache.length > 0) {
      const filteredSubCategories = this.allSubCategoriesCache.filter(
        sc => sc.categoryId === categoryId
      );
      this.subCategoriesCache[categoryId] = filteredSubCategories;
      return of(filteredSubCategories);
    }

    // If nothing is cached, get all subcategories and filter
    return this.getAll().pipe(
      map(allSubCategories => {
        const filteredSubCategories = allSubCategories.filter(
          sc => sc.categoryId === categoryId
        );
        this.subCategoriesCache[categoryId] = filteredSubCategories;
        return filteredSubCategories;
      })
    );
  }

  // Create a new subcategory
  create(subCategory: ISubCategory): Observable<ISubCategory> {
    return this.http.post<ISubCategory>(`${this._baseUrl}`, subCategory).pipe(
      map(newSubCategory => {
        // Update caches
        this.allSubCategoriesCache.push(newSubCategory);
        if (!this.subCategoriesCache[newSubCategory.categoryId]) {
          this.subCategoriesCache[newSubCategory.categoryId] = [];
        }
        this.subCategoriesCache[newSubCategory.categoryId].push(newSubCategory);
        return newSubCategory;
      }),
      catchError(error => {
        console.error('Error creating subcategory:', error);
        return throwError(() => new Error('Failed to create subcategory'));
      })
    );
  }

  // Update an existing subcategory
  update(subCategory: ISubCategory): Observable<ISubCategory> {
    return this.http.put<ISubCategory>(`${this._baseUrl}/${subCategory.id}`, subCategory).pipe(
      map(updatedSubCategory => {
        // Update all subcategories cache
        const allIndex = this.allSubCategoriesCache.findIndex(sc => sc.id === updatedSubCategory.id);
        if (allIndex !== -1) {
          const oldCategoryId = this.allSubCategoriesCache[allIndex].categoryId;
          this.allSubCategoriesCache[allIndex] = updatedSubCategory;

          // Handle category change
          if (oldCategoryId !== updatedSubCategory.categoryId) {
            // Remove from old category cache
            if (this.subCategoriesCache[oldCategoryId]) {
              this.subCategoriesCache[oldCategoryId] = this.subCategoriesCache[oldCategoryId].filter(
                sc => sc.id !== updatedSubCategory.id
              );
            }

            // Add to new category cache
            if (!this.subCategoriesCache[updatedSubCategory.categoryId]) {
              this.subCategoriesCache[updatedSubCategory.categoryId] = [];
            }
            this.subCategoriesCache[updatedSubCategory.categoryId].push(updatedSubCategory);
          } else {
            // Update in same category cache
            const categoryIndex = this.subCategoriesCache[updatedSubCategory.categoryId]?.findIndex(
              sc => sc.id === updatedSubCategory.id
            );
            if (categoryIndex !== undefined && categoryIndex !== -1) {
              this.subCategoriesCache[updatedSubCategory.categoryId][categoryIndex] = updatedSubCategory;
            }
          }
        }

        return updatedSubCategory;
      }),
      catchError(error => {
        console.error(`Error updating subcategory with ID ${subCategory.id}:`, error);
        return throwError(() => new Error('Failed to update subcategory'));
      })
    );
  }

  // Delete a subcategory
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this._baseUrl}/${id}`).pipe(
      map(() => {
        // Find the subcategory to get its category ID before removing
        const subCategory = this.allSubCategoriesCache.find(sc => sc.id === id);

        // Update all subcategories cache
        this.allSubCategoriesCache = this.allSubCategoriesCache.filter(sc => sc.id !== id);

        // Update category-specific cache if we found the subcategory
        if (subCategory && this.subCategoriesCache[subCategory.categoryId]) {
          this.subCategoriesCache[subCategory.categoryId] = this.subCategoriesCache[subCategory.categoryId].filter(
            sc => sc.id !== id
          );
        }
      }),
      catchError(error => {
        console.error(`Error deleting subcategory with ID ${id}:`, error);
        return throwError(() => new Error('Failed to delete subcategory'));
      })
    );
  }

  // Clear all caches
  clearCache(): void {
    this.subCategoriesCache = {};
    this.allSubCategoriesCache = [];
  }
}
