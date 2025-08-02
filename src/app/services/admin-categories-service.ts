import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Category {
  id: string;
  name: string;
  description: string;
  status: 'Active' | 'Inactive';
}

export interface CategoryCreateDto {
  name: string;
  description: string;
  status: 'Active' | 'Inactive';
}

export interface CategoryUpdateDto {
  id: string;
  name: string;
  description: string;
  status: 'Active' | 'Inactive';
}

@Injectable({ providedIn: 'root' })
export class AdminCategoriesService {
  private apiUrl = 'https://localhost:7253/api/Category';

  constructor(private http: HttpClient) {}

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(this.apiUrl);
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
} 