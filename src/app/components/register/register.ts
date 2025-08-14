import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Auth } from '../../services/auth';
import { CommonModule } from '@angular/common';
import { ICustomerRegister } from '../../models/icustomer-register';
import { ISupplierRegister } from '../../models/isupplier-register';

@Component({
  selector: 'app-register',
  templateUrl: './register.html',
  styleUrls: ['./register.css'],
  imports: [CommonModule, ReactiveFormsModule],
  standalone: true
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  selectedRole: 'Customer' | 'Supplier' = 'Customer';

  constructor(
    private fb: FormBuilder,
    private auth: Auth,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.createForm();
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const role = params['role'];
      if (role === 'Supplier' || role === 'Customer') {
        this.onRoleChange(role);
      }
    });
  }

  createForm() {
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(3)]],
      lastName: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/)
      ]],
      phoneNumber: ['',[
        Validators.pattern(/^(\+2|002|02|01)[0-9]{8,11}$/)
      ]],
      companyName: ['',[
        Validators.required,
        Validators.maxLength(50),
      ]],
      companyDescription: ['',[
        Validators.required,
        Validators.maxLength(1000),
      ]],
    });

    this.onRoleChange(this.selectedRole);
  }

  onRoleChange(role: 'Customer' | 'Supplier') {
    this.selectedRole = role;

    const supplierControls = [
      'companyName',
      'companyDescription',
      'taxNumber',
      'BankAccountName',
      'BankAccountNumber'
    ];

    if (role === 'Supplier') {
      supplierControls.forEach(control => {
        this.registerForm.get(control)?.setValidators([Validators.required]);
        this.registerForm.get(control)?.updateValueAndValidity();
      });
      this.registerForm.get('phoneNumber')?.setValidators([Validators.required]);
      this.registerForm.get('phoneNumber')?.updateValueAndValidity();
    } else {
      supplierControls.forEach(control => {
        this.registerForm.get(control)?.clearValidators();
        this.registerForm.get(control)?.updateValueAndValidity();
      });
      this.registerForm.get('phoneNumber')?.clearValidators();
      this.registerForm.get('phoneNumber')?.updateValueAndValidity();
    }
  }

  onSubmit() {
    if (!this.registerForm.valid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const fv = this.registerForm.value;

    if (this.selectedRole === 'Customer') {
      const payload: ICustomerRegister = {
        firstName: fv.firstName,
        lastName: fv.lastName,
        email: fv.email,
        password: fv.password,
        phoneNumber: fv.phoneNumber ?? ''
      };

      this.auth.registerCustomer(payload).subscribe({
        next: () => this.router.navigate(['/products']),
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = err?.error?.message || err?.message || 'Registration failed';
        },
        complete: () => this.isLoading = false
      });
    } else {
      const payload: ISupplierRegister = {
        firstName: fv.firstName,
        lastName: fv.lastName,
        email: fv.email,
        password: fv.password,
        phoneNumber: fv.phoneNumber ?? '',
        factoryName: fv.companyName ?? '',
        description: fv.companyDescription ?? '',
        bankAccountName: fv.BankAccountName ?? '',
        bankAccountNumber: fv.BankAccountNumber ?? '',
        factoryPicPath: undefined,
      };

      this.auth.registerSupplier(payload).subscribe({
        next: () => this.router.navigate(['/seller/products']),
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = err?.error?.message || err?.message || 'Registration failed';
        },
        complete: () => this.isLoading = false
      });
    }
  }
}
