import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IProduct, ProductCreateDto, ProductUpdateDto } from '../models/i-product';

@Injectable({
  providedIn: 'root'
})
export class AdminProductsService {
  private apiUrl = 'https://localhost:7253/api/Product';

  constructor(private http: HttpClient) { }

  // Get all products
  getAllProducts(): Observable<IProduct[]> {
    return this.http.get<IProduct[]>(this.apiUrl);
  }

  // Get single product by ID
  getProductById(id: string): Observable<IProduct> {
    return this.http.get<IProduct>(`${this.apiUrl}/${id}`);
  }

  // Create new product
  createProduct(productData: ProductCreateDto): Observable<IProduct> {
    const formData = new FormData();

    // Add all product data to FormData
    formData.append('name', productData.name);
    formData.append('description', productData.description);
    formData.append('pricePerPiece', productData.pricePerPiece.toString());
    if (productData.pricePer50Piece) {
      formData.append('pricePer50Piece', productData.pricePer50Piece.toString());
    }
    if (productData.pricePer100Piece) {
      formData.append('pricePer100Piece', productData.pricePer100Piece.toString());
    }
    formData.append('noINStock', productData.noINStock.toString());
    formData.append('minNumToFactoryOrder', productData.minNumToFactoryOrder.toString());
    formData.append('approvalStatus', productData.approvalStatus.toString());
    formData.append('shipping', productData.shipping.toString());
    formData.append('subCategoryId', productData.subCategoryId);
    if (productData.warrantyNMonths) {
      formData.append('warrantyNMonths', productData.warrantyNMonths.toString());
    }

    // Add images if they exist
    if (productData.images && productData.images.length > 0) {
      productData.images.forEach((image) => {
        formData.append('Images', image);
      });
    }

    return this.http.post<IProduct>(this.apiUrl, formData);
  }

  // Update existing product
  updateProduct(productData: ProductUpdateDto): Observable<IProduct> {
    const formData = new FormData();

    // Add all product data to FormData
    formData.append('id', productData.id);
    formData.append('name', productData.name);
    formData.append('description', productData.description);
    formData.append('pricePerPiece', productData.pricePerPiece.toString());
    if (productData.pricePer50Piece) {
      formData.append('pricePer50Piece', productData.pricePer50Piece.toString());
    }
    if (productData.pricePer100Piece) {
      formData.append('pricePer100Piece', productData.pricePer100Piece.toString());
    }
    formData.append('noINStock', productData.noINStock.toString());
    formData.append('minNumToFactoryOrder', productData.minNumToFactoryOrder.toString());
    formData.append('approvalStatus', productData.approvalStatus.toString());
    formData.append('shipping', productData.shipping.toString());
    formData.append('subCategoryId', productData.subCategoryId);
    if (productData.warrantyNMonths) {
      formData.append('warrantyNMonths', productData.warrantyNMonths.toString());
    }

    // Add images if they exist
    if (productData.images && productData.images.length > 0) {
      productData.images.forEach((image) => {
        formData.append('Images', image);
      });
    }

    return this.http.put<IProduct>(this.apiUrl, formData);
  }

  // Delete product
  deleteProduct(id: string): Observable<IProduct> {
    return this.http.delete<IProduct>(`${this.apiUrl}/${id}`);
  }
} 