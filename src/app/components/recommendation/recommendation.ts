import { Component, inject, OnInit } from '@angular/core';
import { RecommendationService } from '../../services/recommendation-service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DecJwt } from '../../services/dec-jwt';
import { IProduct } from '../../models/i-product';
import { environment } from '../../../environment/environment';

@Component({
  selector: 'app-recommendation',
  imports: [FormsModule, CommonModule],
  templateUrl: './recommendation.html',
  styleUrl: './recommendation.css'
})
export class Recommendation implements OnInit {
recommendations: IProduct[] = [];
   baseImgUrl=`${environment.imgUrl}`;

  constructor(
    private recService: RecommendationService,
    private decoding: DecJwt
  ) {}

  ngOnInit(): void {
    const userId = this.decoding.getUserIdFromToken();
    if (userId) {
      this.recService.getRecommendations(userId).subscribe({
        next: (res) => this.recommendations = res,
        error: (err) => console.error('Error loading recommendations', err)
      });
    } else {
      console.warn('User not logged in or token missing');
    }
  }
  getProductImage(product: any): string {
    return product.productPicsPathes && product.productPicsPathes.length > 0
    ? this.baseImgUrl + product.productPicsPathes[0]
    : 'https://via.placeholder.com/150';
  }
}
