import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment/environment';
import { IAddress, IAddressCreate, IAddressUpdate } from '../models/iaddress';

@Injectable({
  providedIn: 'root'
})
export class AddressService {
  private apiUrl = `${environment.apiUrl}/Address`;

  constructor(private http: HttpClient) { }

  // Get all addresses
  getAddresses(personId: string): Observable<IAddress[]> {
    return this.http.get<IAddress[]>(this.apiUrl);
  }

  // Get a specific address by ID
  getAddress(id: string): Observable<IAddress> {
    return this.http.get<IAddress>(`${this.apiUrl}/${id}`);
  }

  // Create a new address (sends FormData to match [FromForm])
  createAddress(address: IAddressCreate): Observable<IAddress> {
    // Validate required fields
    if (!address.personId) {
      console.error('PersonId is required but not provided');
      throw new Error('PersonId is required');
    }
    if (!address.city) {
      console.error('City is required but not provided');
      throw new Error('City is required');
    }
    if (!address.state) {
      console.error('State is required but not provided');
      throw new Error('State is required');
    }

    // Create FormData to match [FromForm] expectation
    const formData = new FormData();
    formData.append('PersonId', address.personId);
    formData.append('Street', address.street || '');
    formData.append('City', address.city);
    formData.append('State', address.state);
    formData.append('PostalCode', address.postalCode || '');
    formData.append('Country', address.country || 'Egypt');
    
    console.log('=== ADDRESS CREATION DEBUG ===');
    console.log('Original address data:', address);
    console.log('FormData created for [FromForm]:', formData);
    console.log('API URL:', this.apiUrl);
    console.log('PersonId being sent:', address.personId);
    console.log('City being sent:', address.city);
    console.log('State being sent:', address.state);
    console.log('================================');
    
    return this.http.post<IAddress>(this.apiUrl, formData);
  }

  // Update an existing address (sends FormData to match [FromForm])
  updateAddress(id: string, address: IAddressUpdate): Observable<IAddress> {
    // Validate required fields
    if (!address.personId) {
      console.error('PersonId is required but not provided');
      throw new Error('PersonId is required');
    }
    if (!address.city) {
      console.error('City is required but not provided');
      throw new Error('City is required');
    }
    if (!address.state) {
      console.error('State is required but not provided');
      throw new Error('State is required');
    }

    // Create FormData to match [FromForm] expectation
    const formData = new FormData();
    formData.append('Id', address.id);
    formData.append('PersonId', address.personId);
    formData.append('Street', address.street || '');
    formData.append('City', address.city);
    formData.append('State', address.state);
    formData.append('PostalCode', address.postalCode || '');
    formData.append('Country', address.country || 'Egypt');
    
    console.log('=== ADDRESS UPDATE DEBUG ===');
    console.log('Updating address with FormData (matches [FromForm]):', formData);
    console.log('API URL:', this.apiUrl);
    console.log('================================');
    
    return this.http.put<IAddress>(this.apiUrl, formData);
  }

  // Delete an address
  deleteAddress(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}