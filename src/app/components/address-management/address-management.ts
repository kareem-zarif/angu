// address__managebt.ts
import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AddressService } from '../../services/address.service';
import { Auth, User } from '../../services/auth';
import { LocalStorageNotificationService } from '../../services/local-storage-notification.service';
import { IAddress, IAddressCreate, IAddressUpdate } from '../../models/iaddress';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

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
  @Output() defaultAddressChanged = new EventEmitter<IAddress>();

  // destroy$ used to clean subscriptions on destroy
  private destroy$ = new Subject<void>();

  constructor(
    private addressService: AddressService,
    private authService: Auth,
    private fb: FormBuilder,
    private notificationService: LocalStorageNotificationService
  ) {
    // بناء الفورم مع Validators
    this.addressForm = this.fb.group({
      street: ['', [Validators.maxLength(200)]],
      city: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      state: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      postalCode: ['', [Validators.pattern('^[0-9]{5}(-[0-9]{4})?$')]],
      country: ['Egypt', [Validators.required, Validators.maxLength(100)]]
    });
  }

  ngOnInit(): void {
    // الاشتراك في currentUser$ للتعامل مع تغيّر حالة الدخول خلال عمر الكمبوننت
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
        if (user?.UserId) {
          console.log('Current user ID:', user.UserId);
          this.loadAddresses();
          this.loadDefaultAddressFromLocalStorage();
        } else {
          // Reset list when no user
          this.addresses = [];
          this.defaultAddressId = null;
          this.removeDefaultAddressFromLocalStorage();
        }
      });
  }

  ngOnDestroy(): void {
    // تنظيف كل الاشتراكات
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadAddresses(): void {
    if (!this.currentUser?.UserId) {
      console.error('No user ID available');
      return;
    }

    this.isLoading = true;
    console.log('Loading addresses for user:', this.currentUser.UserId);

    this.addressService.getAddresses(this.currentUser.UserId).subscribe({
      next: (addresses) => {
        console.log('Addresses loaded successfully:', addresses);
        this.addresses = addresses || [];

        // Set default address based on IsDefault from backend
        const defaultAddress = this.addresses.find(addr => addr.IsDefault);
        if (defaultAddress && defaultAddress.id) {
          this.defaultAddressId = defaultAddress.id;
          this.saveDefaultAddressToLocalStorage(defaultAddress.id);
          // silent set/notify (catch to avoid unhandled promise)
          this.addressService.setDefaultAddress(defaultAddress, { persist: false, saveLocal: true }).catch(() => {});
        } else if (this.addresses.length > 0 && this.addresses[0].id) {
          this.setAsDefault(this.addresses[0].id, false); // Set first address as default silently
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading addresses:', error);
        this.notificationService.showError('Failed to load addresses');
        this.isLoading = false;
      }
    });
  }

  // Local storage helper methods
  private getDefaultAddressKey(): string {
    return `defaultAddress_${this.currentUser?.UserId || 'anonymous'}`;
  }

  private saveDefaultAddressToLocalStorage(addressId: string): void {
    if (typeof Storage !== 'undefined' && this.currentUser?.UserId) {
      localStorage.setItem(this.getDefaultAddressKey(), addressId);
    }
  }

  private loadDefaultAddressFromLocalStorage(): void {
    if (typeof Storage !== 'undefined' && this.currentUser?.UserId) {
      const savedDefault = localStorage.getItem(this.getDefaultAddressKey());
      if (savedDefault) {
        this.defaultAddressId = savedDefault;
        console.log('Loaded default address from localStorage:', savedDefault);
      }
    }
  }

  private removeDefaultAddressFromLocalStorage(): void {
    if (typeof Storage !== 'undefined' && this.currentUser?.UserId) {
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
    this.addressForm.markAsUntouched();
    this.addressForm.markAsPristine();
  }

  onSubmit(): void {
    // Force update form validation/values (helps with autofill edge-cases)
    this.addressForm.updateValueAndValidity();
    this.markFormGroupTouched();

    if (!this.addressForm.valid) {
      console.log('Form is invalid:', this.getFormErrors());
      this.notificationService.showError('Please fill in all required fields correctly');
      return;
    }

    if (!this.currentUser?.UserId) {
      console.error('No user ID available');
      this.notificationService.showError('User not authenticated');
      return;
    }

    this.formSubmitting = true;

    // Trim values and prepare data
    const streetVal = this.addressForm.get('street')?.value?.trim() || null;
    const cityVal = this.addressForm.get('city')?.value?.trim();
    const stateVal = this.addressForm.get('state')?.value?.trim();
    const postalVal = this.addressForm.get('postalCode')?.value?.trim() || null;
    const countryVal = this.addressForm.get('country')?.value?.trim() || 'Egypt';

    if (!cityVal || !stateVal) {
      this.notificationService.showError('City and State cannot be empty');
      this.formSubmitting = false;
      return;
    }

    const addressData: IAddressCreate = {
      PersonId: this.currentUser.UserId,
      Street: streetVal,
      City: cityVal,
      State: stateVal,
      PostalCode: postalVal,
      Country: countryVal
    };

    // If editing, call update; else create
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

  // ---------- CREATE (modified to send createPayload explicitly) ----------
  createAddress(addressData: IAddressCreate): void {
    console.log('Creating address (component) - original data:', addressData);

    // Build payload that matches backend DTO exactly
    const createPayload = {
      PersonId: addressData.PersonId,
      Street: addressData.Street,
      City: addressData.City,
      State: addressData.State,
      PostalCode: addressData.PostalCode,
      Country: addressData.Country || 'Egypt'
    };

    // Diagnostic log - check what we're about to send (Network tab should match this)
    console.log('Sending payload to AddressService:', JSON.stringify(createPayload, null, 2));

    // Call service with the explicit payload (service should send JSON)
    this.addressService.createAddress(createPayload).subscribe({
      next: (newAddress) => {
        console.log('Address created successfully:', newAddress);
        // Push to local list
        this.addresses.push(newAddress);

        // If first address -> set default silently
        if (this.addresses.length === 1 && newAddress.id) {
          this.setAsDefault(newAddress.id, false);
          this.addressService.setDefaultAddress(newAddress, { persist: true, saveLocal: true }).catch(() => {});
        }

        this.cancelForm();
        this.notificationService.showSuccess('Address added successfully');
        this.formSubmitting = false;
      },
      error: (error) => {
        console.error('=== ADDRESS CREATION ERROR (component) ===');
        console.error(error);
        this.handleApiError(error, 'Failed to add address');
        this.formSubmitting = false;
      }
    });
  }

  // ---------- UPDATE (keeps original behavior but ensures payload shape) ----------
  updateAddress(id: string, addressData: IAddressCreate): void {
    console.log('Updating address with ID:', id);
    const updatePayload: IAddressUpdate = {
      id: id,
      personId: addressData.PersonId,
      street: addressData.Street,
      city: addressData.City,
      state: addressData.State,
      postalCode: addressData.PostalCode,
      country: addressData.Country || 'Egypt'
    };

    console.log('Update payload (component):', updatePayload);

    this.addressService.updateAddress(id, updatePayload).subscribe({
      next: (updatedAddress) => {
        console.log('Address updated successfully:', updatedAddress);

        const index = this.addresses.findIndex(addr => addr.id === id);
        if (index !== -1) {
          this.addresses[index] = updatedAddress;
        } else {
          this.loadAddresses();
        }

        this.cancelForm();
        this.notificationService.showSuccess('Address updated successfully');
        this.formSubmitting = false;
      },
      error: (error) => {
        console.error('=== ADDRESS UPDATE ERROR (component) ===');
        console.error(error);
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

    this.addressForm.patchValue({
      street: address.street || '',
      city: address.city || '',
      state: address.state || '',
      postalCode: address.postalCode || '',
      country: address.country || 'Egypt'
    });

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

    if (!confirm('Are you sure you want to delete this address?')) {
      return;
    }

    console.log('Deleting address with ID:', id);

    this.addressService.deleteAddress(id).subscribe({
      next: () => {
        console.log('Address deleted successfully');
        this.addresses = this.addresses.filter(addr => addr.id !== id);

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

  setDefaultAddress(addressId: string): void {
    this.setAsDefault(addressId, true);
  }

  private setAsDefault(addressId: string, showSuccessMessage: boolean = true): void {
    if (!addressId) {
      console.error('Address ID is missing');
      this.notificationService.showError('Cannot set default: Address ID missing');
      return;
    }

    const addressExists = this.addresses.some(addr => addr.id === addressId);
    if (!addressExists) {
      console.error('Address not found in current list');
      this.notificationService.showError('Address not found');
      return;
    }

    // Find the previous default address
    const previousDefault = this.addresses.find(addr => addr.id === this.defaultAddressId);

    // Update all addresses locally
    this.addresses = this.addresses.map(addr => ({
      ...addr,
      IsDefault: addr.id === addressId
    }));

    this.defaultAddressId = addressId;
    this.saveDefaultAddressToLocalStorage(addressId);

    if (showSuccessMessage) {
      this.notificationService.showSuccess('Default address updated successfully');
    }

    console.log('Default address set successfully (locally)', addressId);

    // Update backend for the new default and previous default
    const newDefault = this.addresses.find(addr => addr.id === addressId);
    if (newDefault) {
      this.updateBackendDefault(newDefault);
      this.addressService.setDefaultAddress(newDefault, { persist: true, saveLocal: true }).catch(() => {});
    }
    if (previousDefault && previousDefault.id !== addressId) {
      previousDefault.IsDefault = false;
      this.updateBackendDefault(previousDefault);
    }

    if (showSuccessMessage) {
      this.notificationService.showSuccess('Default address updated successfully');
    }
  }

  private updateBackendDefault(address: IAddress): void {
    const payload: IAddressUpdate = {
      id: address.id || '',
      personId: this.currentUser?.UserId || '',
      street: address.street,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country || 'Egypt',
      IsDefault: address.IsDefault || false
    };
    this.addressService.updateAddress(address.id || '', payload).subscribe({
      next: () => console.log(`Updated IsDefault for address ${address.id}`),
      error: (error) => console.error(`Error updating IsDefault for address ${address.id}:`, error)
    });
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
    let errorMessage = defaultMessage;

    if (error?.error) {
      if (typeof error.error === 'string') {
        errorMessage += ': ' + error.error;
      } else if (error.error.message) {
        errorMessage += ': ' + error.error.message;
      } else if (error.error.title) {
        errorMessage += ': ' + error.error.title;
      }

      if (error.error.errors) {
        const validationErrors = Object.values(error.error.errors).flat();
        if (validationErrors.length > 0) {
          errorMessage += ': ' + validationErrors.join(', ');
        }
        // Log validation details
        console.error('Validation errors details:', error.error.errors);
      }
    } else if (error?.message) {
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

  get sortedAddresses(): IAddress[] {
    return [...this.addresses].sort((b, a) => (b.IsDefault === a.IsDefault ? 0 : b.IsDefault ? -1 : 1));
  }
}
