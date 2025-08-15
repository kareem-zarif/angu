import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AddressService } from '../../services/address.service';
import { Auth } from '../../services/auth';
import { LocalStorageNotificationService } from '../../services/local-storage-notification.service';
import { IAddress, IAddressCreate, IAddressUpdate } from '../../models/iaddress';
import { User } from '../../services/auth';
import { Subscription } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-address-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './address-management.html',
  styleUrls: ['./address-management.css']
})
export class AddressManagement implements OnInit, OnDestroy {
  addresses: IAddress[] = [];
  addressForm: FormGroup;
  isEditing = false;
  isAdding = false;
  editingAddressId: string | null = null;
  currentUser: User | null = null;
  defaultAddressId: string | null = null;
  isLoading = false;
  formSubmitting = false;
  private userSubscription: Subscription = new Subscription();

  constructor(
    private addressService: AddressService,
    private authService: Auth,
    private fb: FormBuilder,
    private notificationService: LocalStorageNotificationService
  ) {
    this.addressForm = this.fb.group({
      street: ['', [Validators.maxLength(200)]],
      city: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      state: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      postalCode: ['', [Validators.pattern('^[0-9]{5}(-[0-9]{4})?$')]],
      country: ['Egypt', [Validators.required, Validators.maxLength(100)]]
    });
  }

  ngOnInit(): void {
    this.userSubscription = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user?.UserId) {
        console.log('Current user ID:', user.UserId);
        this.loadAddresses();
        this.loadDefaultAddressFromLocalStorage();
      }
    });
  }

  ngOnDestroy(): void {
    this.userSubscription.unsubscribe();
  }

  loadAddresses(): void {
    if (!this.currentUser?.UserId) {
      console.error('No user ID available');
      return;
    }

    this.isLoading = true;
    console.log('Loading addresses for user:', this.currentUser.UserId);
    
    // Since the backend doesn't have a specific endpoint for getting addresses by person ID,
    // we'll get all addresses and the service will filter them by person ID
    this.addressService.getAddresses(this.currentUser.UserId).subscribe({
      next: (addresses) => {
        console.log('Addresses loaded successfully:', addresses);
        this.addresses = addresses || [];
        
        // If no default is set and we have addresses, set first as default
        if (!this.defaultAddressId && this.addresses.length > 0) {
          this.setFirstAddressAsDefault();
        }
        
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading addresses:', error);
        console.error('Error status:', error.status);
        console.error('Error message:', error.message);
        
        // If the main endpoint fails, there are no real alternative endpoints
        // based on your backend controller
        this.notificationService.showError('Failed to load addresses');
        this.isLoading = false;
      }
    });
  }

  tryAlternativeEndpoints(): void {
    // Based on your backend controller, there are no alternative endpoints
    // The service will fall back to the same method
    console.log('No alternative endpoints available based on backend controller');
    this.notificationService.showError('Failed to load addresses');
    this.isLoading = false;
  }

  // Local storage methods for default address management
  private getDefaultAddressKey(): string {
    return `defaultAddress_${this.currentUser?.UserId}`;
  }

  private saveDefaultAddressToLocalStorage(addressId: string): void {
    if (typeof Storage !== 'undefined') {
      localStorage.setItem(this.getDefaultAddressKey(), addressId);
    }
  }

  private loadDefaultAddressFromLocalStorage(): void {
    if (typeof Storage !== 'undefined') {
      const savedDefault = localStorage.getItem(this.getDefaultAddressKey());
      if (savedDefault) {
        this.defaultAddressId = savedDefault;
        console.log('Loaded default address from localStorage:', savedDefault);
      }
    }
  }

  private removeDefaultAddressFromLocalStorage(): void {
    if (typeof Storage !== 'undefined') {
      localStorage.removeItem(this.getDefaultAddressKey());
    }
  }

  showAddForm(): void {
    this.isAdding = true;
    this.isEditing = false;
    this.editingAddressId = null;
    this.resetForm();
  }

  resetForm(): void {
    this.addressForm.reset({
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'Egypt'
    });
    // Clear all validation states
    this.addressForm.markAsUntouched();
    this.addressForm.markAsPristine();
  }

  onSubmit(): void {
    if (!this.addressForm.valid) {
      console.log('Form is invalid:', this.getFormErrors());
      this.markFormGroupTouched();
      this.notificationService.showError('Please fill in all required fields correctly');
      return;
    }

    if (!this.currentUser?.UserId) {
      console.error('No user ID available');
      this.notificationService.showError('User not authenticated');
      return;
    }

    this.formSubmitting = true;

    const addressData: IAddressCreate = {
      personId: this.currentUser.UserId,
      street: this.addressForm.get('street')?.value?.trim() || null,
      city: this.addressForm.get('city')?.value?.trim(),
      state: this.addressForm.get('state')?.value?.trim(),
      postalCode: this.addressForm.get('postalCode')?.value?.trim() || null,
      country: this.addressForm.get('country')?.value?.trim() || 'Egypt'
    };

    if (this.isEditing && this.editingAddressId) {
      this.updateAddress(this.editingAddressId, addressData);
    } else {
      this.createAddress(addressData);
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.addressForm.controls).forEach(key => {
      const control = this.addressForm.get(key);
      control?.markAsTouched();
    });
  }

  private getFormErrors(): any {
    const errors: any = {};
    Object.keys(this.addressForm.controls).forEach(key => {
      const control = this.addressForm.get(key);
      if (control?.errors) {
        errors[key] = control.errors;
      }
    });
    return errors;
  }

  createAddress(addressData: IAddressCreate): void {
    console.log('Creating address:', addressData);
    
    this.addressService.createAddress(addressData).subscribe({
      next: (newAddress) => {
        console.log('Address created successfully:', newAddress);
        this.addresses.push(newAddress);
        
        // If this is the first address, set it as default
        if (this.addresses.length === 1 && newAddress.id) {
          this.setAsDefault(newAddress.id, false); // Don't show success message for auto-default
        }
        
        this.cancelForm();
        this.notificationService.showSuccess('Address added successfully');
        this.formSubmitting = false;
      },
      error: (error) => {
        console.error('=== ADDRESS CREATION ERROR ===');
        console.error('Error creating address:', error);
        this.handleApiError(error, 'Failed to add address');
        this.formSubmitting = false;
      }
    });
  }

  updateAddress(id: string, addressData: IAddressCreate): void {
    console.log('Updating address with ID:', id);
    console.log('Update data:', addressData);
    
    // Create the update payload that matches IAddressUpdate interface
    const updatePayload: IAddressUpdate = {
      id: id,
      personId: addressData.personId,
      street: addressData.street,
      city: addressData.city,
      state: addressData.state,
      postalCode: addressData.postalCode,
      country: addressData.country
    };

    console.log('Update payload:', updatePayload);

    this.addressService.updateAddress(id, updatePayload).subscribe({
      next: (updatedAddress) => {
        console.log('Address updated successfully:', updatedAddress);
        
        // Update the address in the local array
        const index = this.addresses.findIndex(addr => addr.id === id);
        if (index !== -1) {
          this.addresses[index] = updatedAddress;
        } else {
          // If not found, refresh the list
          this.loadAddresses();
        }
        
        this.cancelForm();
        this.notificationService.showSuccess('Address updated successfully');
        this.formSubmitting = false;
      },
      error: (error) => {
        console.error('=== ADDRESS UPDATE ERROR ===');
        console.error('Error updating address:', error);
        this.handleApiError(error, 'Failed to update address');
        this.formSubmitting = false;
      }
    });
  }

  editAddress(address: IAddress): void {
    console.log('Editing address:', address);
    
    if (!address.id) {
      console.error('Address ID is missing');
      this.notificationService.showError('Cannot edit address: ID missing');
      return;
    }
    
    this.isEditing = true;
    this.isAdding = false;
    this.editingAddressId = address.id;
    
    // Populate the form with current address values
    this.addressForm.patchValue({
      street: address.street || '',
      city: address.city || '',
      state: address.state || '',
      postalCode: address.postalCode || '',
      country: address.country || 'Egypt'
    });
    
    // Mark form as pristine after patching values
    this.addressForm.markAsPristine();
    this.addressForm.markAsUntouched();
    
    console.log('Form populated with values:', this.addressForm.value);
  }

  deleteAddress(id: string): void {
    if (!id) {
      console.error('Address ID is missing');
      this.notificationService.showError('Cannot delete address: ID missing');
      return;
    }

    if (confirm('Are you sure you want to delete this address?')) {
      console.log('Deleting address with ID:', id);
      
      this.addressService.deleteAddress(id).subscribe({
        next: () => {
          console.log('Address deleted successfully');
          
          // Remove from addresses array
          this.addresses = this.addresses.filter(addr => addr.id !== id);
          
          // If we deleted the default address, set a new default or clear it
          if (id === this.defaultAddressId) {
            if (this.addresses.length > 0) {
              this.setAsDefault(this.addresses[0].id || '', false);
            } else {
              this.defaultAddressId = null;
              this.removeDefaultAddressFromLocalStorage();
            }
          }
          
          this.notificationService.showSuccess('Address deleted successfully');
        },
        error: (error) => {
          console.error('Error deleting address:', error);
          this.handleApiError(error, 'Failed to delete address');
        }
      });
    }
  }

  setDefaultAddress(addressId: string): void {
    this.setAsDefault(addressId, true);
  }

  private setAsDefault(addressId: string, showSuccessMessage: boolean = true): void {
    if (!addressId) {
      console.error('Address ID is missing');
      this.notificationService.showError('Cannot set default: Address ID missing');
      return;
    }

    // Check if the address exists in our list
    const addressExists = this.addresses.some(addr => addr.id === addressId);
    if (!addressExists) {
      console.error('Address not found in current list');
      this.notificationService.showError('Address not found');
      return;
    }

    console.log('Setting address as default:', addressId);
    
    // Set as default locally
    this.defaultAddressId = addressId;
    this.saveDefaultAddressToLocalStorage(addressId);
    
    if (showSuccessMessage) {
      this.notificationService.showSuccess('Default address updated successfully');
    }
    
    console.log('Default address set successfully (locally)');
  }

  setFirstAddressAsDefault(): void {
    if (this.addresses.length > 0 && this.addresses[0].id) {
      this.setAsDefault(this.addresses[0].id, false);
    }
  }

  cancelForm(): void {
    this.isEditing = false;
    this.isAdding = false;
    this.editingAddressId = null;
    this.formSubmitting = false;
    this.resetForm();
  }

  private handleApiError(error: any, defaultMessage: string): void {
    console.error('API Error:', error);
    console.error('Error status:', error.status);
    console.error('Error message:', error.message);
    console.error('Error response:', error.error);
    
    let errorMessage = defaultMessage;
    
    if (error.error) {
      if (typeof error.error === 'string') {
        errorMessage += ': ' + error.error;
      } else if (error.error.message) {
        errorMessage += ': ' + error.error.message;
      } else if (error.error.title) {
        errorMessage += ': ' + error.error.title;
      }
      
      // Log detailed validation errors if available
      if (error.error.errors) {
        console.error('Validation errors:');
        Object.keys(error.error.errors).forEach(key => {
          console.error(`  ${key}:`, error.error.errors[key]);
        });
        
        // Show validation errors to user
        const validationErrors = Object.values(error.error.errors).flat();
        if (validationErrors.length > 0) {
          errorMessage += ': ' + validationErrors.join(', ');
        }
      }
    } else if (error.message) {
      errorMessage += ': ' + error.message;
    }
    
    this.notificationService.showError(errorMessage);
  }

  // TrackBy function for ngFor performance
  trackByAddressId(index: number, address: IAddress): string {
    return address.id || index.toString();
  }

  // Utility methods for template
  isFieldInvalid(fieldName: string): boolean {
    const field = this.addressForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.addressForm.get(fieldName);
    if (field && field.errors) {
      if (field.errors['required']) return `${this.getFieldLabel(fieldName)} is required`;
      if (field.errors['minlength']) return `${this.getFieldLabel(fieldName)} must be at least ${field.errors['minlength'].requiredLength} characters`;
      if (field.errors['maxlength']) return `${this.getFieldLabel(fieldName)} must be less than ${field.errors['maxlength'].requiredLength} characters`;
      if (field.errors['pattern']) return 'Please enter a valid format';
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      'street': 'Street',
      'city': 'City',
      'state': 'State',
      'postalCode': 'Postal Code',
      'country': 'Country'
    };
    return labels[fieldName] || fieldName;
  }
}