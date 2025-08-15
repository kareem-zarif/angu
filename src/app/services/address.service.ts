import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { IAddress, IAddressCreate, IAddressUpdate } from '../models/iaddress';

@Injectable({
  providedIn: 'root'
})
export class AddressService {
  private apiUrl = 'https://localhost:7253/api/Address';

  constructor(private http: HttpClient) { }

  // Get all addresses and filter by person ID (since no specific endpoint exists)
  getAddresses(personId: string): Observable<IAddress[]> {
    return this.http.get<IAddress[]>(this.apiUrl).pipe(
      map(addresses => addresses.filter(address => address.personId === personId))
    );
  }

  // Get a specific address by ID
  getAddress(id: string): Observable<IAddress> {
    return this.http.get<IAddress>(`${this.apiUrl}/${id}`);
  }

  // Create a new address (matches AddressCreateDto exactly)
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

    // Create payload that exactly matches AddressCreateDto
    const createPayload = {
      PersonId: address.personId,
      Street: address.street || null,
      City: address.city,
      State: address.state,
      PostalCode: address.postalCode || null,
      Country: address.country || "Egypt"
    };
    
    console.log('=== ADDRESS CREATION DEBUG ===');
    console.log('Original address data:', address);
    console.log('Create payload (matches AddressCreateDto):', createPayload);
    console.log('API URL:', this.apiUrl);
    console.log('Request payload (JSON):', JSON.stringify(createPayload, null, 2));
    console.log('PersonId type:', typeof createPayload.PersonId);
    console.log('PersonId value:', createPayload.PersonId);
    console.log('================================');
    
    return this.http.post<IAddress>(this.apiUrl, createPayload);
  }

  // Update an existing address (matches your backend - no ID in URL)
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

    // Create payload that exactly matches AddressUpdateDto
    // The ID should already be in the address object from the component
    const updatePayload = {
      Id: address.id, // Use the id from the address object
      PersonId: address.personId,
      Street: address.street || null,
      City: address.city,
      State: address.state,
      PostalCode: address.postalCode || null,
      Country: address.country || "Egypt"
    };
    
    console.log('=== ADDRESS UPDATE DEBUG ===');
    console.log('Updating address with payload (matches AddressUpdateDto):', updatePayload);
    console.log('API URL:', this.apiUrl); // Note: No ID in URL for PUT
    console.log('Request payload (JSON):', JSON.stringify(updatePayload, null, 2));
    console.log('================================');
    
    // PUT request without ID in URL, as per your controller
    return this.http.put<IAddress>(this.apiUrl, updatePayload);
  }

  // Delete an address
  deleteAddress(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Alternative methods (these likely won't work with your current backend)
  // Keeping them as fallback options but they probably won't match your API
  getAddressesByPersonId(personId: string): Observable<IAddress[]> {
    // This will likely return all addresses since your backend doesn't support filtering by person ID in URL
    console.warn('This endpoint likely does not exist in your backend - falling back to get all and filter');
    return this.getAddresses(personId);
  }

  getAddressesByUserId(userId: string): Observable<IAddress[]> {
    // This endpoint doesn't exist in your backend
    console.warn('This endpoint does not exist in your backend - falling back to get all and filter');
    return this.getAddresses(userId);
  }
}