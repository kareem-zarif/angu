import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddressManagement } from './address-management';
import { AddressService } from '../../services/address.service';
import { Auth } from '../../services/auth';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { LocalStorageNotificationService } from '../../services/local-storage-notification.service';
import { of } from 'rxjs';

describe('AddressManagement', () => {
  let component: AddressManagement;
  let fixture: ComponentFixture<AddressManagement>;
  let mockAddressService: jasmine.SpyObj<AddressService>;
  let mockAuthService: jasmine.SpyObj<Auth>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockNotificationService: jasmine.SpyObj<LocalStorageNotificationService>;

  beforeEach(async () => {
    mockAddressService = jasmine.createSpyObj('AddressService', [
      'getAddresses', 'createAddress', 'updateAddress', 'deleteAddress', 'setDefaultAddress'
    ]);
    mockAuthService = jasmine.createSpyObj('Auth', [], {
      currentUser$: of(null)
    });
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockNotificationService = jasmine.createSpyObj('LocalStorageNotificationService', [
      'showSuccess', 'showError'
    ]);

    await TestBed.configureTestingModule({
      imports: [AddressManagement],
      providers: [
        { provide: AddressService, useValue: mockAddressService },
        { provide: Auth, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
        { provide: LocalStorageNotificationService, useValue: mockNotificationService },
        FormBuilder
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AddressManagement);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty addresses array', () => {
    expect(component.addresses).toEqual([]);
  });

  it('should initialize with form controls', () => {
    expect(component.addressForm.get('street')).toBeTruthy();
    expect(component.addressForm.get('city')).toBeTruthy();
    expect(component.addressForm.get('state')).toBeTruthy();
    expect(component.addressForm.get('postalCode')).toBeTruthy();
    expect(component.addressForm.get('country')).toBeTruthy();
  });

  it('should show add form when showAddForm is called', () => {
    component.showAddForm();
    expect(component.isAdding).toBeTrue();
    expect(component.isEditing).toBeFalse();
  });

  it('should show edit form when showEditForm is called', () => {
         const mockAddress = {
       id: '1',
       street: '123 Test St',
       city: 'Test City',
       state: 'Test State',
       postalCode: '12345',
       country: 'Test Country'
     };
    
    component.showEditForm(mockAddress);
    expect(component.isEditing).toBeTrue();
    expect(component.isAdding).toBeFalse();
    expect(component.currentAddress).toEqual(mockAddress);
  });

  it('should cancel form when cancelForm is called', () => {
    component.isAdding = true;
    component.isEditing = true;
    component.currentAddress = { street: 'test', city: 'test', state: 'test' };
    
    component.cancelForm();
    
    expect(component.isAdding).toBeFalse();
    expect(component.isEditing).toBeFalse();
    expect(component.currentAddress).toBeNull();
  });

  it('should navigate back when goBack is called', () => {
    component.goBack();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
  });
});
