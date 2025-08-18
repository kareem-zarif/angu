import { Component } from '@angular/core';
import { RecommendationService } from '../../services/recommendation-service';
import { IProduct } from '../../models/i-product';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environment/environment';

@Component({
  selector: 'app-new-releases',
  imports: [CommonModule],
  templateUrl: './new-releases.html',
  styleUrl: './new-releases.css'
})
export class NewReleases {
  newReleases: IProduct[] = [];
  baseImgUrl = `${environment.imgUrl}`;

  constructor(private recService: RecommendationService) { }

  ngOnInit(): void {
    this.recService.getNewReleases().subscribe({
      next: (res) => this.newReleases = res,
      error: (err) => console.error('Error loading new releases', err)
    });
  }

  getProductImage(product: IProduct): string {
    return product.productPicsPathes && product.productPicsPathes.length > 0
    ? this.baseImgUrl + product.productPicsPathes[0]
    : 'https://via.placeholder.com/150';
  }
}
