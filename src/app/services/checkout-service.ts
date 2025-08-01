import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface CheckoutData {
  deliveryAddress: {
    recipient: string;
    address: string;
    instructions: string;
  };
  selectedPaymentMethod: string;
  creditCards: any[];
  mobileCashOptions: any[];
  orderSummary: {
    items: number;
    shipping: number;
    freeDeliveryDiscount: number;
    total: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class CheckoutService {
  private checkoutData: CheckoutData = {
    deliveryAddress: {
      recipient: 'Ibrahim Sayed',
      address: 'مدينة العاشر من رمضان, الشرقية, Egypt',
      instructions: ''
    },
    selectedPaymentMethod: 'cash-on-delivery',
    creditCards: [],
    mobileCashOptions: [
      { name: 'Vodafone Cash', icon: 'assets/vodafone-cash.png', added: false },
      { name: 'Orange Cash', icon: 'assets/orange-cash.png', added: false },
      { name: 'Fawry', icon: 'assets/fawry.png', added: false }
    ],
    orderSummary: {
      items: 36640.00,
      shipping: 20.00,
      freeDeliveryDiscount: 20.00,
      total: 36640.00
    }
  };

  getCheckoutData(): Observable<CheckoutData> {
    return of(this.checkoutData);
  }

  updateDeliveryAddress(address: any): Observable<any> {
    this.checkoutData.deliveryAddress = { ...this.checkoutData.deliveryAddress, ...address };
    return of(this.checkoutData.deliveryAddress);
  }

  updatePaymentMethod(method: string): Observable<any> {
    this.checkoutData.selectedPaymentMethod = method;
    return of({ selectedPaymentMethod: method });
  }

  addCreditCard(card: any): Observable<any> {
    this.checkoutData.creditCards.push(card);
    return of(card);
  }

  updateMobileCash(option: any): Observable<any> {
    const index = this.checkoutData.mobileCashOptions.findIndex(opt => opt.name === option.name);
    if (index !== -1) {
      this.checkoutData.mobileCashOptions[index] = option;
    }
    return of(option);
  }

  processCashOnDelivery(orderSummary: any): Observable<any> {
    // Simulate API call for cash on delivery processing
    return of({
      success: true,
      orderId: 'ORD-' + Date.now(),
      message: 'Order placed successfully with cash on delivery'
    });
  }

  processPayment(paymentMethod: string, orderSummary: any): Observable<any> {
    // Simulate API call for payment processing
    return of({
      success: true,
      transactionId: 'TXN-' + Date.now(),
      paymentMethod: paymentMethod,
      message: `Payment processed successfully via ${paymentMethod}`
    });
  }

  saveCheckoutData(): Observable<any> {
    // Save checkout data to localStorage or backend
    localStorage.setItem('checkoutData', JSON.stringify(this.checkoutData));
    return of({ success: true });
  }

  clearCheckoutData(): Observable<any> {
    this.checkoutData = {
      deliveryAddress: {
        recipient: '',
        address: '',
        instructions: ''
      },
      selectedPaymentMethod: 'cash-on-delivery',
      creditCards: [],
      mobileCashOptions: [
        { name: 'Vodafone Cash', icon: 'assets/vodafone-cash.png', added: false },
        { name: 'Orange Cash', icon: 'assets/orange-cash.png', added: false },
        { name: 'Fawry', icon: 'assets/fawry.png', added: false }
      ],
      orderSummary: {
        items: 0,
        shipping: 0,
        freeDeliveryDiscount: 0,
        total: 0
      }
    };
    localStorage.removeItem('checkoutData');
    return of({ success: true });
  }
} 