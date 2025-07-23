import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IProduct } from '../models/i-product';

// @Injectable({
//   providedIn: 'root'
// })
export class ProductService {
  private _baseUrl = '';

  constructor(private http: HttpClient) { } //Recommended constructor pattern for feature services

  getAll(): Observable<IProduct[]> {
    return this.http.get<IProduct[]>(`${this._baseUrl}/products`);
  }

  getById(id: number): Observable<IProduct> {
    return this.http.get<IProduct>(`${this._baseUrl}/products/${id}`);
  }

  add(product: IProduct): Observable<IProduct> {
    return this.http.post<IProduct>(`${this._baseUrl}/products`, product);
  }
  update(product: IProduct): Observable<IProduct> {
    return this.http.put<IProduct>(`${this._baseUrl}/products/${product.id}`, product);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this._baseUrl}/products/${id}`);
  }

}
