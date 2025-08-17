import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Auth } from '../../services/auth';
import { AddressService } from '../../services/address.service';
import { IAddress, IAddressCreate, IAddressUpdate } from '../../models/iaddress';

@Component({
  selector: 'app-seller-address-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './seller-address-management.html',
  styleUrls: ['./seller-address-management.css']
})
export class SellerAddressManagementComponent implements OnInit, OnDestroy {
  addresses: IAddress[] = [];
  selectedAddress: IAddress | null = null;
  addressForm: FormGroup;
  isEditMode = false;
  isSubmitting = false;
  showForm = false;
  successMessage = '';
  errorMessage = '';
  hasError = false;
  private subscription = new Subscription();

  constructor(
    private fb: FormBuilder,
    private authService: Auth,
    private addressService: AddressService
  ) {
    this.addressForm = this.fb.group({
      street: ['', Validators.required],
      city: ['', Validators.required],
      state: ['', Validators.required],
      postalCode: [''],
      country: ['Egypt', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadAddresses();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  loadAddresses(): void {
    const currentUserId = this.authService.getUserId();
    if (!currentUserId) {
      console.error('❌ SellerAddressManagement: No user ID found');
      this.showError('User not authenticated');
      return;
    }

    console.log('🔄 SellerAddressManagement: Loading addresses for user:', currentUserId);
    
    this.subscription.add(
      this.addressService.getAddresses(currentUserId).subscribe({
        next: (addresses) => {
          console.log('✅ SellerAddressManagement: Addresses loaded:', addresses);
          // Filter addresses for the current user
          this.addresses = addresses.filter(addr => addr.personId === currentUserId);
          console.log('✅ SellerAddressManagement: Filtered addresses for current user:', this.addresses);
        },
        error: (error) => {
          console.error('❌ SellerAddressManagement: Error loading addresses:', error);
          this.showError('Failed to load addresses');
        }
      })
    );
  }

  createAddress(): void {
    console.log('🔄 SellerAddressManagement: Opening create form');
    this.resetForm();
    this.isEditMode = false;
    this.showForm = true;
  }

  editAddress(address: IAddress): void {
    console.log('🔄 SellerAddressManagement: Editing address:', address);
    this.selectedAddress = address;
    this.isEditMode = true;
    this.showForm = true;
    
    this.addressForm.patchValue({
      street: address.street || '',
      city: address.city || '',
      state: address.state || '',
      postalCode: address.postalCode || '',
      country: address.country || 'Egypt'
    });
  }

  deleteAddress(address: IAddress): void {
    if (!address.id) {
      console.error('❌ SellerAddressManagement: Address ID is missing');
      this.showError('Invalid address ID');
      return;
    }

    if (confirm('Are you sure you want to delete this address?')) {
      console.log('🔄 SellerAddressManagement: Deleting address:', address);
      
      this.subscription.add(
        this.addressService.deleteAddress(address.id).subscribe({
          next: () => {
            console.log('✅ SellerAddressManagement: Address deleted successfully');
            this.showSuccess('Address deleted successfully');
            this.loadAddresses();
          },
          error: (error) => {
            console.error('❌ SellerAddressManagement: Error deleting address:', error);
            this.showError('Failed to delete address');
          }
        })
      );
    }
  }

  onSubmit(): void {
    if (this.addressForm.invalid) {
      console.log('❌ SellerAddressManagement: Form is invalid');
      this.showError('Please fill in all required fields');
      return;
    }

    this.isSubmitting = true;
    const formValue = this.addressForm.value;
    const currentUserId = this.authService.getUserId();

    if (!currentUserId) {
      console.error('❌ SellerAddressManagement: No user ID found');
      this.showError('User not authenticated');
      this.isSubmitting = false;
      return;
    }

    if (this.isEditMode && this.selectedAddress) {
      if (!this.selectedAddress.id) {
        console.error('❌ SellerAddressManagement: Selected address ID is missing');
        this.showError('Invalid address ID');
        this.isSubmitting = false;
        return;
      }

      // Update existing address
      const updateData: IAddressUpdate = {
        id: this.selectedAddress.id,
        personId: currentUserId,
        street: formValue.street,
        city: formValue.city,
        state: formValue.state,
        postalCode: formValue.postalCode,
        country: formValue.country
      };

      console.log('🔄 SellerAddressManagement: Updating address with data:', updateData);
      console.log('🔄 SellerAddressManagement: Current user ID:', currentUserId);

      this.subscription.add(
        this.addressService.updateAddress(this.selectedAddress.id, updateData).subscribe({
          next: (updatedAddress) => {
            console.log('✅ SellerAddressManagement: Address updated successfully:', updatedAddress);
            this.showSuccess('Address updated successfully');
            this.loadAddresses();
            this.resetForm();
            this.isSubmitting = false;
          },
          error: (error) => {
            console.error('❌ SellerAddressManagement: Error updating address:', error);
            console.error('❌ Error details:', {
              status: error.status,
              statusText: error.statusText,
              message: error.message,
              error: error.error
            });
            
            let errorMessage = 'Failed to update address. Please try again.';
            if (error.status === 400) {
              errorMessage = 'Invalid data. Please check your input.';
            } else if (error.status === 401) {
              errorMessage = 'Unauthorized. Please log in again.';
            } else if (error.status === 500) {
              errorMessage = 'Server error. Please try again later.';
            }
            
            this.showError(errorMessage);
            this.isSubmitting = false;
          }
        })
      );
    } else {
      // Create new address
      const createData: IAddressCreate = {
        personId: currentUserId,
        street: formValue.street,
        city: formValue.city,
        state: formValue.state,
        postalCode: formValue.postalCode,
        country: formValue.country
      };

      console.log('🔄 SellerAddressManagement: Creating address with data:', createData);
      console.log('🔄 SellerAddressManagement: Current user ID:', currentUserId);
      console.log('🔄 SellerAddressManagement: Form values:', formValue);
      console.log('🔄 SellerAddressManagement: Street value:', formValue.street);
      console.log('🔄 SellerAddressManagement: City value:', formValue.city);
      console.log('🔄 SellerAddressManagement: State value:', formValue.state);

      this.subscription.add(
        this.addressService.createAddress(createData).subscribe({
          next: (newAddress) => {
            console.log('✅ SellerAddressManagement: Address created successfully:', newAddress);
            this.showSuccess('Address created successfully');
            this.loadAddresses();
            this.resetForm();
            this.isSubmitting = false;
          },
          error: (error) => {
            console.error('❌ SellerAddressManagement: Error creating address:', error);
            console.error('❌ Error details:', {
              status: error.status,
              statusText: error.statusText,
              message: error.message,
              error: error.error
            });
            console.error('❌ Full error object:', error);
            console.error('❌ Backend response:', error.error);
            
            let errorMessage = 'Failed to create address. Please try again.';
            if (error.status === 400) {
              errorMessage = 'Invalid data. Please check your input.';
            } else if (error.status === 401) {
              errorMessage = 'Unauthorized. Please log in again.';
            } else if (error.status === 500) {
              errorMessage = 'Server error. Please try again later.';
            }
            
            this.showError(errorMessage);
            this.isSubmitting = false;
          }
        })
      );
    }
  }

  cancelEdit(): void {
    this.resetForm();
  }

  resetForm(): void {
    this.isEditMode = false;
    this.selectedAddress = null;
    this.showForm = false;
    this.addressForm.reset({
      country: 'Egypt'
    });
  }

  private showSuccess(message: string): void {
    this.successMessage = message;
    this.hasError = false;
    this.errorMessage = '';
    
    // Auto-hide success message after 3 seconds
    setTimeout(() => {
      this.successMessage = '';
    }, 3000);
  }

  private showError(message: string): void {
    this.errorMessage = message;
    this.hasError = true;
    this.successMessage = '';
  }

  refreshData(): void {
    console.log('🔄 SellerAddressManagement: Refreshing data...');
    this.loadAddresses();
  }
}
