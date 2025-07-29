import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

export interface Supplier {
  id: string;
  name: string;
  email: string;
  status: 'Active' | 'Inactive';
}

@Injectable({ providedIn: 'root' })
export class AdminSuppliersService {
  private suppliers: Supplier[] = [
    { id: '1', name: 'Supplier A', email: 'a@email.com', status: 'Active' },
    { id: '2', name: 'Supplier B', email: 'b@email.com', status: 'Inactive' },
    { id: '3', name: 'Supplier C', email: 'c@email.com', status: 'Active' },
  ];
  private suppliers$ = new BehaviorSubject<Supplier[]>(this.suppliers);

  getSuppliers(params: { search?: string; sortBy?: keyof Supplier; sortDir?: 'asc' | 'desc'; page?: number; pageSize?: number }): Observable<{ data: Supplier[]; total: number }> {
    let filtered = [...this.suppliers];
    if (params.search) {
      const s = params.search.toLowerCase();
      filtered = filtered.filter(sup =>
        sup.name.toLowerCase().includes(s) ||
        sup.email.toLowerCase().includes(s)
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

  createSupplier(supplier: Omit<Supplier, 'id'>): Observable<Supplier> {
    const newSupplier: Supplier = { ...supplier, id: Date.now().toString() };
    this.suppliers.unshift(newSupplier);
    this.suppliers$.next(this.suppliers);
    return of(newSupplier).pipe(delay(300));
  }

  updateSupplier(id: string, supplier: Partial<Supplier>): Observable<Supplier | undefined> {
    const idx = this.suppliers.findIndex(s => s.id === id);
    if (idx > -1) {
      this.suppliers[idx] = { ...this.suppliers[idx], ...supplier };
      this.suppliers$.next(this.suppliers);
      return of(this.suppliers[idx]).pipe(delay(300));
    }
    return of(undefined).pipe(delay(300));
  }

  deleteSupplier(id: string): Observable<boolean> {
    const idx = this.suppliers.findIndex(s => s.id === id);
    if (idx > -1) {
      this.suppliers.splice(idx, 1);
      this.suppliers$.next(this.suppliers);
      return of(true).pipe(delay(300));
    }
    return of(false).pipe(delay(300));
  }
} 