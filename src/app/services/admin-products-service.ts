import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { IProduct } from '../models/i-product';

@Injectable({ providedIn: 'root' })
export class AdminProductsService {
  private products: IProduct[] = [
    {
      id: '1',
      name: 'بلاستيك شفاف',
      description: 'مصنع أبو النمر للمنتجات البلاستيكية و الشفافة للصناعات الحديثة',
      pricePerPiece: 35,
      pricePer50Piece: 1600,
      pricePer100Piece: 3100,
      noInStock: 233,
      minNumToFactoryOrder: 100,
      approvalStatus: 'Approved',
      productPicsPathes: ['assets/519wBXYrKuL.jpg'],
      warrantyNMonths: 12,
      shipping: 'FreeINSameGovernate',
      subCategoryId: 'plastics',
      rating: 4.2,
      supplierNames: ['مصنع أبو النمر']
    },
    {
      id: '2',
      name: 'أنابيب ستانلس',
      description: 'أنابيب ستانلس عالية الجودة للصناعات المتقدمة',
      pricePerPiece: 120,
      pricePer50Piece: 5800,
      pricePer100Piece: 11000,
      noInStock: 150,
      minNumToFactoryOrder: 50,
      approvalStatus: 'Approved',
      productPicsPathes: ['assets/الفولاذ المقاوم للصدأ 310 الأنابيب.jpg'],
      warrantyNMonths: 6,
      shipping: 'Paid',
      subCategoryId: 'steels',
      rating: 4.6,
      supplierNames: ['حديدكو']
    },
    {
      id: '3',
      name: 'لفائف ألومنيوم',
      description: 'لفائف ألومنيوم للاستخدامات الصناعية والمنزلية',
      pricePerPiece: 90,
      pricePer50Piece: 4200,
      pricePer100Piece: 8200,
      noInStock: 85,
      minNumToFactoryOrder: 25,
      approvalStatus: 'Pending',
      productPicsPathes: ['assets/zzc.jpg'],
      warrantyNMonths: 3,
      shipping: 'Free',
      subCategoryId: 'aluminum',
      rating: 3.9,
      supplierNames: ['ألومكو']
    }
  ];
  private products$ = new BehaviorSubject<IProduct[]>(this.products);

  getProducts(params: { search?: string; sortBy?: keyof IProduct; sortDir?: 'asc' | 'desc'; page?: number; pageSize?: number }): Observable<{ data: IProduct[]; total: number }> {
    let filtered = [...this.products];
    if (params.search) {
      const s = params.search.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(s) ||
        p.description.toLowerCase().includes(s)
      );
    }
    if (params.sortBy) {
      filtered = filtered.sort((a, b) => {
        const valA = a[params.sortBy!];
        const valB = b[params.sortBy!];
        if (valA == null) return 1;
        if (valB == null) return -1;
        if (valA < valB) return params.sortDir === 'asc' ? -1 : 1;
        if (valA > valB) return params.sortDir === 'asc' ? 1 : -1;
        return 0;
      });
    }
    const total = filtered.length;
    if (params.page !== undefined && params.pageSize !== undefined) {
      const start = (params.page - 1) * params.pageSize;
      filtered = filtered.slice(start, start + params.pageSize);
    }
    return of({ data: filtered, total }).pipe(delay(300));
  }

  createProduct(product: Omit<IProduct, 'id'>): Observable<IProduct> {
    const newProduct: IProduct = { ...product, id: Date.now().toString() };
    this.products.unshift(newProduct);
    this.products$.next(this.products);
    return of(newProduct).pipe(delay(300));
  }

  updateProduct(id: string, product: Partial<IProduct>): Observable<IProduct | undefined> {
    const idx = this.products.findIndex(p => p.id === id);
    if (idx > -1) {
      this.products[idx] = { ...this.products[idx], ...product };
      this.products$.next(this.products);
      return of(this.products[idx]).pipe(delay(300));
    }
    return of(undefined).pipe(delay(300));
  }

  deleteProduct(id: string): Observable<boolean> {
    const idx = this.products.findIndex(p => p.id === id);
    if (idx > -1) {
      this.products.splice(idx, 1);
      this.products$.next(this.products);
      return of(true).pipe(delay(300));
    }
    return of(false).pipe(delay(300));
  }
} 