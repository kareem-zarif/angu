import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SubCategory {
  id: string;
  name: string;
  categoryName: string;
  products: ProductResDto[];
}

export interface SubCategoryCreateDto {
  name: string;
  description?: string;
  categoryId: string;
}

export interface SubCategoryUpdateDto {
  id: string;
  name: string;
  description?: string;
  categoryId: string;
}

export interface ProductResDto {
  id: string;
  name: string;
  description: string;
  pricePerPiece: number;
  noINStock: number;
  approvalStatus: number;
  shipping: number;
  subCategoryId: string;
  productPicsPathes: string[];
  supplierNames: string[];
}

@Injectable({ providedIn: 'root' })
export class AdminSubCategoriesService {
  private apiUrl = 'https://localhost:7253/api/SubCategory';

  constructor(private http: HttpClient) {}

  getSubCategories(): Observable<SubCategory[]> {
    return this.http.get<SubCategory[]>(this.apiUrl);
  }

  getSubCategoryById(id: string): Observable<SubCategory> {
    return this.http.get<SubCategory>(`${this.apiUrl}/${id}`);
  }

  createSubCategory(subCategory: SubCategoryCreateDto): Observable<SubCategory> {
    const formData = new FormData();
    formData.append('Name', subCategory.name);
    if (subCategory.description) {
      formData.append('Description', subCategory.description);
    }
    formData.append('CategoryId', subCategory.categoryId);
    
    return this.http.post<SubCategory>(this.apiUrl, formData);
  }

  updateSubCategory(subCategory: SubCategoryUpdateDto): Observable<SubCategory> {
    const formData = new FormData();
    formData.append('Id', subCategory.id);
    formData.append('Name', subCategory.name);
    if (subCategory.description) {
      formData.append('Description', subCategory.description);
    }
    formData.append('CategoryId', subCategory.categoryId);
    
    return this.http.put<SubCategory>(this.apiUrl, formData);
  }

  deleteSubCategory(id: string): Observable<SubCategory> {
    return this.http.delete<SubCategory>(`${this.apiUrl}/${id}`);
  }
}

