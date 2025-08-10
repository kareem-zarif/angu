import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-success',
  imports: [],
  templateUrl: './success.html',
  styleUrl: './success.css'
})
export class SuccessComponent {
  
  orderId: string | null = null;

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.orderId = this.route.snapshot.queryParamMap.get('orderId');
    // Optionally, verify payment status with your API using orderId
    console.log('Payment successful for order:', this.orderId);
  }
}
