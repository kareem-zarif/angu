import { Component } from '@angular/core';
import { RecommendationService } from '../../services/recommendation-service';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environment/environment';
import { IProduct } from '../../models/i-product';

@Component({
  selector: 'app-best-sellers',
  imports: [CommonModule],
  templateUrl: './best-sellers.html',
  styleUrl: './best-sellers.css'
})
export class BestSellers {
bestSellers: any[] = [];
   baseImgUrl=`${environment.imgUrl}`;

  constructor(private recService: RecommendationService) {}

  ngOnInit(): void {
    this.recService.getBestSellers().subscribe({
      next: (res) => this.bestSellers = res,
      error: (err) => console.error('Error loading best sellers', err)
    });
  }

  getProductImage(product: IProduct): string {
    return product.productPicsPathes && product.productPicsPathes.length > 0
    ? this.baseImgUrl + product.productPicsPathes[0]
    : 'https://via.placeholder.com/150';
  }
}
