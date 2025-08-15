// address.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError, BehaviorSubject, firstValueFrom } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { IAddress, IAddressCreate, IAddressUpdate } from '../models/iaddress';

@Injectable({
  providedIn: 'root'
})
export class AddressService {
  private apiUrl = 'https://localhost:7253/api/Address';
  private jsonHeaders = new HttpHeaders({ 'Content-Type': 'application/json; charset=utf-8' });

  // BehaviorSubject holds the current default address (null if none).
  private _defaultAddress$ = new BehaviorSubject<IAddress | null>(null);
  // Public observable that components subscribe to
  public defaultAddress$ = this._defaultAddress$.asObservable();

  constructor(private http: HttpClient) {
    // nothing here by default; caller can call loadDefaultFromLocalStorage(personId)
  }

  // ----------------- Address endpoints -----------------
  getAddresses(personId: string): Observable<IAddress[]> {
    if (!personId) return of([]);
    return this.http.get<IAddress[]>(this.apiUrl, { headers: this.jsonHeaders }).pipe(
      map(addresses => Array.isArray(addresses) ? addresses.filter(a => a.personId === personId) : []),
      catchError(err => {
        console.error('AddressService.getAddresses error:', err);
        return throwError(() => err);
      })
    );
  }

  getAddress(id: string): Observable<IAddress> {
    if (!id) return throwError(() => new Error('Address id is required'));
    return this.http.get<IAddress>(`${this.apiUrl}/${id}`, { headers: this.jsonHeaders }).pipe(
      catchError(err => {
        console.error('AddressService.getAddress error:', err);
        return throwError(() => err);
      })
    );
  }

  createAddress(payload: IAddressCreate): Observable<IAddress> {
    console.log('AddressService.createAddress payload:', payload);
    const body = JSON.stringify({
      PersonId: payload.PersonId,
      Street: payload.Street ?? null,
      City: payload.City,
      State: payload.State,
      PostalCode: payload.PostalCode ?? null,
      Country: payload.Country ?? 'Egypt'
    });
    return this.http.post<IAddress>(this.apiUrl, body, { headers: this.jsonHeaders }).pipe(
      tap(newAddr => {
        // If backend returned IsDefault true, update BehaviorSubject and localStorage
        if (newAddr?.IsDefault && newAddr.id && newAddr.personId) {
          this.setDefaultAddress(newAddr, { persist: true, saveLocal: true }).catch(() => {});
        }
      }),
      catchError(err => {
        console.error('AddressService.createAddress error:', err);
        return throwError(() => err);
      })
    );
  }

  updateAddress(id: string, payload: IAddressUpdate): Observable<IAddress> {
    if (!id) return throwError(() => new Error('Address id is required for update'));
    const body = JSON.stringify({
      Id: id,
      PersonId: payload.personId,
      Street: payload.street ?? null,
      City: payload.city,
      State: payload.state,
      PostalCode: payload.postalCode ?? null,
      Country: payload.country ?? 'Egypt',
      IsDefault: (payload as any).IsDefault ?? false
    });

    return this.http.put<IAddress>(this.apiUrl, body, { headers: this.jsonHeaders }).pipe(
      tap(updated => {
        // If backend marks it default - update subject & localStorage
        if (updated?.IsDefault && updated.id && updated.personId) {
          this.setDefaultAddress(updated, { persist: true, saveLocal: true }).catch(() => {});
        } else {
          // If the updated address is the current default but backend cleared IsDefault,
          // ensure we clear BehaviorSubject if needed.
          const current = this._defaultAddress$.getValue();
          if (current && updated.id === current.id && !updated.IsDefault) {
            this._defaultAddress$.next(null);
            // we won't remove localStorage automatically here; caller decides
          }
        }
      }),
      catchError(err => {
        console.error('AddressService.updateAddress error:', err);
        return throwError(() => err);
      })
    );
  }

  deleteAddress(id: string): Observable<void> {
    if (!id) return throwError(() => new Error('Address id is required for delete'));
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.jsonHeaders }).pipe(
      tap(() => {
        const current = this._defaultAddress$.getValue();
        if (current && current.id === id) {
          this._defaultAddress$.next(null);
          // remove from localStorage only if you want global effect
        }
      }),
      catchError(err => {
        console.error('AddressService.deleteAddress error:', err);
        return throwError(() => err);
      })
    );
  }

  createAddressRaw(payload: IAddressCreate): Observable<IAddress> {
    console.log('AddressService.createAddressRaw payload (no stringify):', payload);
    return this.http.post<IAddress>(this.apiUrl, payload, { headers: this.jsonHeaders }).pipe(
      catchError(err => {
        console.error('AddressService.createAddressRaw error:', err);
        return throwError(() => err);
      })
    );
  }

  // ----------------- Default address state handling -----------------

  // key helper
  private getDefaultAddressKey(personId: string | null | undefined): string {
    return `defaultAddress_${personId || 'unknown'}`;
  }

  /**
   * Set the default address inside the BehaviorSubject.
   * options.persist = true -> will attempt to notify backend via updateAddress (caller may do that)
   * options.saveLocal = true -> save id to localStorage for personId
   *
   * Returns a Promise that resolves immediately after setting local BehaviorSubject.
   */
  async setDefaultAddress(address: IAddress | null, options?: { persist?: boolean; saveLocal?: boolean }): Promise<void> {
    // set BehaviorSubject right away so UI updates
    this._defaultAddress$.next(address);

    if (address && options?.saveLocal && address.personId) {
      try {
        localStorage.setItem(this.getDefaultAddressKey(address.personId), address.id || '');
      } catch (err) {
        console.warn('Could not save default address to localStorage', err);
      }
    }

    // optionally persist to backend by calling updateAddress if requested
    if (options?.persist && address && address.id) {
      try {
        // call updateAddress but do not await extensively (fire-and-forget is acceptable)
        // ensure IsDefault: true sent to backend
        const payload: IAddressUpdate = {
          id: address.id,
          personId: address.personId || '',
          street: address.street,
          city: address.city,
          state: address.state,
          postalCode: address.postalCode,
          country: address.country,
          // @ts-ignore allow IsDefault extra prop
          IsDefault: true
        } as any;
        // use firstValueFrom to await once (optional)
        await firstValueFrom(this.updateAddress(address.id, payload));
      } catch (err) {
        console.error('Failed to persist default address to backend:', err);
      }
    }
  }

  /**
   * Load default address from localStorage for a given personId and push it to subject (if exists).
   * It will try to fetch the address from backend and set it.
   */
  loadDefaultFromLocalStorage(personId: string | null | undefined): void {
    if (!personId) {
      this._defaultAddress$.next(null);
      return;
    }

    const key = this.getDefaultAddressKey(personId);
    const savedId = localStorage.getItem(key);
    if (!savedId) {
      this._defaultAddress$.next(null);
      return;
    }

    // fetch from API and set
    this.getAddress(savedId).pipe(
      catchError(err => {
        console.warn('Could not load default address from API, clearing subject', err);
        this._defaultAddress$.next(null);
        return of(null as unknown as IAddress);
      })
    ).subscribe(addr => {
      if (addr) this._defaultAddress$.next(addr);
      else this._defaultAddress$.next(null);
    });
  }

  /**
   * Remove saved default from localStorage for personId and clear subject.
   */
  clearDefaultForPerson(personId: string | null | undefined): void {
    if (personId) {
      try { localStorage.removeItem(this.getDefaultAddressKey(personId)); } catch (err) { /* ignore */ }
    }
    this._defaultAddress$.next(null);
  }
}
