import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register-selection',
  imports: [CommonModule],
  templateUrl: './register-selection.html',
  styleUrl: './register-selection.css'
})
export class RegisterSelection {

  constructor(private router: Router) {}

  navigateToRegister(role: 'Customer' | 'Supplier') {
    console.log(`Navigating to register with role: ${role}`);
    this.router.navigate(['/register'], { queryParams: { role } });
  }
}
