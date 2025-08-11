import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CheckoutService } from '../../services/checkout-service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css'
})
export class CheckoutComponent implements OnInit {
  // Delivery address
  deliveryAddress = {
    recipient: 'Ibrahim Sayed',
    address: 'مدينة العاشر من رمضان, الشرقية, Egypt',
    instructions: ''
  };

  // Payment methods
  selectedPaymentMethod = 'cash-on-delivery';
  creditCards: any[] = [];
  mobileCashOptions = [
    { name: 'Vodafone Cash', icon: 'assets/vodafone-cash.png', added: false },
    { name: 'Orange Cash', icon: 'assets/orange-cash.png', added: false },
    { name: 'Fawry', icon: 'assets/fawry.png', added: false }
  ];

  // Order summary
  orderSummary = {
    items: 36640.00,
    shipping: 20.00,
    freeDeliveryDiscount: 20.00,
    total: 36640.00
  };

  // UI state
  showAddCard = false;
  showDeliveryInstructions = false;
  showAddMobileCash = false;

  constructor(
    private checkoutService: CheckoutService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadCheckoutData();
  }

  loadCheckoutData() {
    // Load saved checkout data from service
    this.checkoutService.getCheckoutData().subscribe(data => {
      if (data) {
        this.deliveryAddress = data.deliveryAddress || this.deliveryAddress;
        this.selectedPaymentMethod = data.selectedPaymentMethod || this.selectedPaymentMethod;
        this.creditCards = data.creditCards || [];
        this.mobileCashOptions = data.mobileCashOptions || this.mobileCashOptions;
      }
    });
  }

  changeDeliveryAddress() {
    // Navigate to address selection or open modal
    console.log('Change delivery address');
  }

  addDeliveryInstructions() {
    this.showDeliveryInstructions = !this.showDeliveryInstructions;
  }

  addCreditCard() {
    this.showAddCard = !this.showAddCard;
  }

  addMobileCash(option: any) {
    option.added = !option.added;
    this.checkoutService.updateMobileCash(option).subscribe();
  }

  selectPaymentMethod(method: string) {
    this.selectedPaymentMethod = method;
    this.checkoutService.updatePaymentMethod(method).subscribe();
  }

  usePaymentMethod() {
    if (this.selectedPaymentMethod === 'cash-on-delivery') {
      this.checkoutService.processCashOnDelivery(this.orderSummary).subscribe(
        response => {
          console.log('Order placed successfully:', response);
          // Navigate to confirmation page
          this.router.navigate(['/orders']);
        },
        error => {
          console.error('Error placing order:', error);
        }
      );
    } else {
      // Handle other payment methods
      this.checkoutService.processPayment(this.selectedPaymentMethod, this.orderSummary).subscribe(
        response => {
          console.log('Payment processed:', response);
        },
        error => {
          console.error('Payment error:', error);
        }
      );
    }
  }

  calculateTotal(): number {
    return this.orderSummary.items + this.orderSummary.shipping - this.orderSummary.freeDeliveryDiscount;
  }
}
