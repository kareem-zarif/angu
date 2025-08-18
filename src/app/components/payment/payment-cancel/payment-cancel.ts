import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-payment-cancel',
  imports: [],
  templateUrl: './payment-cancel.html',
  styleUrl: './payment-cancel.css'
})
export class PaymentCancel {
constructor(private router: Router) {}

  goToCart(): void {
    this.router.navigate(['/cart']);
  }
}
