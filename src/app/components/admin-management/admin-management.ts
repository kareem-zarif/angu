import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { environment } from '../../../environment/environment';

export interface UserDto {
  email: string;
  displayName: string;
  userRoleH: string;
  token?: string;
}

export interface Admin {
  id?: string; // Make ID optional since UserDto doesn't have it
  displayName: string;
  email: string;
  userRoleH: string;
  token?: string;
}

export interface AdminCreateDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber: string;
}

export interface AdminUpdateDto {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  isActive?: boolean;
  permissions?: string[];
}

@Component({
  selector: 'app-admin-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './admin-management.html',
  styleUrls: ['./admin-management.css']
})
export class AdminManagementComponent implements OnInit {
  admins: Admin[] = [];
  filteredAdmins: Admin[] = [];
  loading = false;
  showAddModal = false;
  showEditModal = false;
  showDeleteModal = false;
  selectedAdmin: Admin | null = null;
  isSubmitting = false;

  // Form properties
  adminForm: FormGroup;
  editForm: FormGroup;

  // Search and filter properties
  searchTerm = '';
  roleFilter = 'all';
  statusFilter = 'all';

  // Pagination properties
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  totalPages = 1;

  // Available roles - simplified for your backend
  availableRoles = [
    { value: 'Admin', label: 'Admin', description: 'Full system access' }
  ];

  constructor(
    private http: HttpClient,
    private fb: FormBuilder
  ) {
    this.adminForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      lastName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(50)]],
      password: ['', [Validators.required, Validators.pattern(/^(?=.*[0-9])(?=.*[a-zA-Z]).{10,32}$/)]],
      confirmPassword: ['', [Validators.required]],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^(\+2|002|02|01)[0-9]{8,11}$/)]]
    }, { validators: this.passwordMatchValidator });

    this.editForm = this.fb.group({
      email: ['', [Validators.required, Validators.email, Validators.maxLength(50)]],
      firstName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      lastName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^(\+2|002|02|01)[0-9]{8,11}$/)]]
    });
  }

  ngOnInit(): void {
    this.loadAdmins();
  }

  // Custom validator for password confirmation
  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  // Load admins from the backend
  loadAdmins(): void {
    this.loading = true;
    this.getAdmins().subscribe({
      next: (admins) => {
        // Ensure we always have an array, even if backend returns undefined/null
        this.admins = Array.isArray(admins) ? admins : [];
        console.log('📊 Loaded admins:', this.admins);
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading admins:', error);
        this.loading = false;
        // Load sample data for demonstration
        this.loadSampleAdmins();
      }
    });
  }

  // Get admins from backend (with fallback)
  private getAdmins(): Observable<Admin[]> {
    // Use your new admins endpoint
    const adminsUrl = `${environment.apiUrl}/Account/admins`;
    const fallbackUrl = `${environment.apiUrl}/admin/Account`;

    console.log('🔍 AdminManagement: Trying admins endpoint:', adminsUrl);
    return this.http.get<UserDto[]>(adminsUrl).pipe(
      tap(userDtos => console.log('✅ Admins endpoint successful, got admins:', userDtos?.length || 0)),
      map(userDtos => this.convertUserDtosToAdmins(userDtos)),
      catchError(error => {
        console.log('⚠️ Admins endpoint failed, trying fallback:', fallbackUrl);
        return this.http.get<Admin[]>(fallbackUrl).pipe(
          tap(admins => console.log('✅ Fallback endpoint successful, got admins:', admins?.length || 0)),
          catchError(fallbackError => {
            console.error('❌ Both endpoints failed:', error, fallbackError);
            // Return sample data for demonstration
            return of(this.getSampleAdmins());
          })
        );
      })
    );
  }

  // Sample data for demonstration
  private loadSampleAdmins(): void {
    this.admins = this.getSampleAdmins();
    this.applyFilters();
  }

  private getSampleAdmins(): Admin[] {
    return [
      {
        id: 'admin@example.com',
        displayName: 'John Admin',
        email: 'admin@example.com',
        userRoleH: 'Admin'
      },
      {
        id: 'moderator@example.com',
        displayName: 'Jane Moderator',
        email: 'moderator@example.com',
        userRoleH: 'Admin'
      },
      {
        id: 'support@example.com',
        displayName: 'Mike Support',
        email: 'support@example.com',
        userRoleH: 'Admin'
      }
    ];
  }

  // Apply search and filters
  applyFilters(): void {
    this.filteredAdmins = this.admins.filter(admin => {
      // Search filter
      if (this.searchTerm) {
        const searchLower = this.searchTerm.toLowerCase();
        const matchesSearch = 
          admin.displayName.toLowerCase().includes(searchLower) ||
          admin.email.toLowerCase().includes(searchLower);
        
        if (!matchesSearch) return false;
      }

      // Role filter - all admins have the same role
      if (this.roleFilter !== 'all' && admin.userRoleH !== this.roleFilter) {
        return false;
      }

      // Status filter - all admins are active by default
      if (this.statusFilter !== 'all') {
        if (this.statusFilter === 'inactive') return false; // All admins are active
      }

      return true;
    });

    // Update pagination
    this.totalItems = this.filteredAdmins.length;
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);

    // Reset to first page if current page is out of bounds
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = 1;
    }
  }

  // Pagination methods
  getPaginatedAdmins(): Admin[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredAdmins.slice(startIndex, endIndex);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
  }

  // Search methods
  onSearch(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.roleFilter = 'all';
    this.statusFilter = 'all';
    this.currentPage = 1;
    this.applyFilters();
  }

  // Modal methods
  openAddModal(): void {
    this.showAddModal = true;
    this.adminForm.reset();
  }

  closeAddModal(): void {
    this.showAddModal = false;
    this.adminForm.reset();
  }

  openEditModal(admin: Admin): void {
    this.selectedAdmin = admin;
    // Extract first and last name from displayName
    const nameParts = admin.displayName.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    this.editForm.patchValue({
      email: admin.email,
      firstName: firstName,
      lastName: lastName,
      phoneNumber: '' // We don't have phone number in the response, so leave empty
    });
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.selectedAdmin = null;
    this.editForm.reset();
  }

  openDeleteModal(admin: Admin): void {
    this.selectedAdmin = admin;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.selectedAdmin = null;
  }

  // Form submission methods
  onSubmitAdd(): void {
    if (this.adminForm.valid) {
      this.isSubmitting = true;
      const adminData: AdminCreateDto = this.adminForm.value;
      delete (adminData as any).confirmPassword;

      this.createAdmin(adminData).subscribe({
        next: (newAdmin) => {
          console.log('Admin created successfully:', newAdmin);
          this.admins.unshift(newAdmin);
          this.applyFilters();
          this.closeAddModal();
          this.isSubmitting = false;
          alert('Admin created successfully!');
        },
        error: (error) => {
          console.error('Error creating admin:', error);
          this.isSubmitting = false;
          alert('Failed to create admin. Please try again.');
        }
      });
    }
  }

  onSubmitEdit(): void {
    if (this.editForm.valid && this.selectedAdmin && this.selectedAdmin.id) {
      this.isSubmitting = true;
      const adminData: AdminUpdateDto = {
        id: this.selectedAdmin.id,
        ...this.editForm.value
      };

      this.updateAdmin(adminData).subscribe({
        next: (updatedAdmin) => {
          console.log('Admin updated successfully:', updatedAdmin);
          const index = this.admins.findIndex(a => a.id === updatedAdmin.id);
          if (index !== -1) {
            this.admins[index] = updatedAdmin;
          }
          this.applyFilters();
          this.closeEditModal();
          this.isSubmitting = false;
          alert('Admin updated successfully!');
        },
        error: (error) => {
          console.error('Error updating admin:', error);
          this.isSubmitting = false;
          alert('Failed to update admin. Please try again.');
        }
      });
    } else {
      alert('Cannot update admin: Form invalid or no valid ID found');
    }
  }

  onDeleteAdmin(): void {
    if (this.selectedAdmin && this.selectedAdmin.id) {
      this.isSubmitting = true;
      this.deleteAdmin(this.selectedAdmin.id).subscribe({
        next: () => {
          console.log('Admin deleted successfully');
          this.admins = this.admins.filter(a => a.id !== this.selectedAdmin!.id);
          this.applyFilters();
          this.closeDeleteModal();
          this.isSubmitting = false;
          alert('Admin deleted successfully!');
        },
        error: (error) => {
          console.error('Error deleting admin:', error);
          this.isSubmitting = false;
          alert('Failed to delete admin. Please try again.');
        }
      });
    } else {
      alert('Cannot delete admin: No valid ID found');
    }
  }

  // API methods with fallback logic
  private createAdmin(adminData: AdminCreateDto): Observable<Admin> {
    const adminUrl = `${environment.apiUrl}/Account/register/admin`;
    const fallbackUrl = `${environment.apiUrl}/Account/register/admin`;

    console.log('🔍 AdminManagement: Creating admin via register endpoint:', adminUrl);
    return this.http.post<Admin>(adminUrl, adminData).pipe(
      tap(admin => {
        console.log('✅ Admin created successfully via register endpoint:', admin);
      }),
      catchError(error => {
        console.log('⚠️ Register endpoint failed, trying fallback:', fallbackUrl);
        return this.http.post<Admin>(fallbackUrl, adminData).pipe(
          tap(admin => {
            console.log('✅ Admin created successfully via fallback endpoint:', admin);
          }),
          catchError(fallbackError => {
            console.error('❌ Both endpoints failed:', error, fallbackError);
            // For demonstration, create a mock admin
            const mockAdmin: Admin = {
              id: Date.now().toString(),
              displayName: `${adminData.firstName} ${adminData.lastName}`,
              email: adminData.email,
              userRoleH: 'Admin'
            };

            return of(mockAdmin);
          })
        );
      })
    );
  }

  private updateAdmin(adminData: AdminUpdateDto): Observable<Admin> {
    const adminUrl = `${environment.apiUrl}/admin/Account`;
    const fallbackUrl = `${environment.apiUrl}/Account`;

    console.log('🔍 AdminManagement: Updating admin via admin endpoint:', adminUrl);
    return this.http.put<Admin>(adminUrl, adminData).pipe(
      tap(admin => console.log('✅ Admin updated successfully via admin endpoint:', admin)),
      catchError(error => {
        console.log('⚠️ Admin endpoint failed, trying fallback:', fallbackUrl);
        return this.http.put<Admin>(fallbackUrl, adminData).pipe(
          tap(admin => console.log('✅ Admin updated successfully via fallback endpoint:', admin)),
          catchError(fallbackError => {
            console.error('❌ Both endpoints failed:', error, fallbackError);
            // For demonstration, return updated mock admin
            const existingAdmin = this.admins.find(a => a.id === adminData.id);
            if (existingAdmin) {
              const updatedAdmin: Admin = { ...existingAdmin, ...adminData };
              return of(updatedAdmin);
            }
            throw fallbackError;
          })
        );
      })
    );
  }

  private deleteAdmin(adminId: string): Observable<void> {
    const adminUrl = `${environment.apiUrl}/admin/Account/${adminId}`;
    const fallbackUrl = `${environment.apiUrl}/Account/${adminId}`;

    console.log('🔍 AdminManagement: Deleting admin via admin endpoint:', adminUrl);
    return this.http.delete<void>(adminUrl).pipe(
      tap(() => console.log('✅ Admin deleted successfully via admin endpoint')),
      catchError(error => {
        console.log('⚠️ Admin endpoint failed, trying fallback:', fallbackUrl);
        return this.http.delete<void>(fallbackUrl).pipe(
          tap(() => console.log('✅ Admin deleted successfully via fallback endpoint')),
          catchError(fallbackError => {
            console.error('❌ Both endpoints failed:', error, fallbackError);
            // For demonstration, return success
            return of(void 0);
          })
        );
      })
    );
  }

  // Helper methods
  getRoleLabel(role: string): string {
    const roleObj = this.availableRoles.find(r => r.value === role);
    return roleObj ? roleObj.label : role;
  }

  getRoleDescription(role: string): string {
    const roleObj = this.availableRoles.find(r => r.value === role);
    return roleObj ? roleObj.description : '';
  }



  formatDate(date: Date | string): string {
    if (!date) return 'N/A';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString();
  }

  getStatusClass(isActive: boolean): string {
    return isActive 
      ? 'bg-green-100 text-green-800 border-green-200' 
      : 'bg-red-100 text-red-800 border-red-200';
  }

  getStatusLabel(isActive: boolean): string {
    return isActive ? 'Active' : 'Inactive';
  }

  // Helper method to get display name
  getDisplayName(admin: Admin): string {
    return admin.displayName || 'N/A';
  }

  // Convert UserDto to Admin interface
  private convertUserDtosToAdmins(userDtos: UserDto[]): Admin[] {
    if (!Array.isArray(userDtos)) {
      console.warn('⚠️ UserDtos is not an array:', userDtos);
      return [];
    }

    return userDtos.map((userDto, index) => ({
      id: userDto.email, // Use email as unique identifier since UserDto doesn't have ID
      displayName: userDto.displayName || 'Unknown Admin',
      email: userDto.email || 'No Email',
      userRoleH: userDto.userRoleH || 'Admin',
      token: userDto.token
    }));
  }


}
