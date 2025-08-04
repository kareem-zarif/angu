import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Supplier, SupplierCreateDto, SupplierResDto, SupplierUpdateDto } from '../models/supplier';

@Injectable({ providedIn: 'root' })
export class AdminSuppliersService {
  private apiUrl = 'https://localhost:7253/api/Supplier';

  constructor(private http: HttpClient) {}

  getAll(): Observable<SupplierResDto[]> {
    return this.http.get<SupplierResDto[]>(this.apiUrl);
  }

  getById(id: string): Observable<SupplierResDto> {
    return this.http.get<SupplierResDto>(`${this.apiUrl}/${id}`);
  }

  create(data: SupplierCreateDto): Observable<SupplierResDto> {
    return this.http.post<SupplierResDto>(this.apiUrl, data);
  }

  update(data: SupplierUpdateDto): Observable<SupplierResDto> {
    const formData = new FormData();
    formData.append('Id', data.id);
    formData.append('FirstName', data.firstName);
    formData.append('LastName', data.lastName);
    formData.append('Phone', data.phone);
    formData.append('FactoryName', data.factoryName);
    if (data.description) {
      formData.append('Description', data.description);
    }
    return this.http.put<SupplierResDto>(this.apiUrl, formData);
  }

  delete(id: string): Observable<SupplierResDto> {
    return this.http.delete<SupplierResDto>(`${this.apiUrl}/${id}`);
  }
}