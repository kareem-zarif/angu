import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { ICategory } from '../models/i-category';
import { environment } from '../../environment/environment';


@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private apiUrl = `${environment.apiUrl}/Category`;

  // Cache for categories
  private categoriesCache: ICategory[] = [];

  constructor(private http: HttpClient) { }

  // Get all categories
  getAll(): Observable<ICategory[]> {
    // If we have cached categories, return them
    if (this.categoriesCache.length > 0) {
      return of(this.categoriesCache);
    }

    return this.http.get<ICategory[]>(this.apiUrl).pipe(
      tap(categories => console.log('Categories fetched:', categories)),
      map(categories => {
        this.categoriesCache = categories;
        return categories;
      }),
      catchError(error => {
        console.error('Error fetching categories:', error);
        return throwError(() => new Error('Failed to load categories'));
      })
    );
  }

  // Get category by ID
  getById(id: string): Observable<ICategory> {
    // Check cache first
    const cachedCategory = this.categoriesCache.find(c => c.id === id);
    if (cachedCategory) {
      return of(cachedCategory);
    }

    return this.http.get<ICategory>(`${this.apiUrl}/${id}`).pipe(
      catchError(error => {
        console.error(`Error fetching category with ID ${id}:`, error);
        return throwError(() => new Error(`Category with ID ${id} not found`));
      })
    );
  }

  // Create a new category
  create(category: ICategory): Observable<ICategory> {
    return this.http.post<ICategory>(`${this.apiUrl}`, category).pipe(
      map(newCategory => {
        // Update cache
        this.categoriesCache.push(newCategory);
        return newCategory;
      }),
      catchError(error => {
        console.error('Error creating category:', error);
        return throwError(() => new Error('Failed to create category'));
      })
    );
  }

  // Update an existing category
  update(category: ICategory): Observable<ICategory> {
    return this.http.put<ICategory>(`${this.apiUrl}/${category.id}`, category).pipe(
      map(updatedCategory => {
        // Update cache
        const index = this.categoriesCache.findIndex(c => c.id === updatedCategory.id);
        if (index !== -1) {
          this.categoriesCache[index] = updatedCategory;
        }
        return updatedCategory;
      }),
      catchError(error => {
        console.error(`Error updating category with ID ${category.id}:`, error);
        return throwError(() => new Error('Failed to update category'));
      })
    );
  }

  // Delete a category
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      map(() => {
        // Update cache
        this.categoriesCache = this.categoriesCache.filter(c => c.id !== id);
      }),
      catchError(error => {
        console.error(`Error deleting category with ID ${id}:`, error);
        return throwError(() => new Error('Failed to delete category'));
      })
    );
  }

  // Clear cache
  clearCache(): void {
    this.categoriesCache = [];
  }
}
