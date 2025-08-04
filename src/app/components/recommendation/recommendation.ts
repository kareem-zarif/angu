import { Component, inject, OnInit } from '@angular/core';
import { IProduct } from '../../models/i-product';
import { RecommendationService } from '../../services/recommendation-service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-recommendation',
  imports: [FormsModule, CommonModule],
  templateUrl: './recommendation.html',
  styleUrl: './recommendation.css'
})
export class Recommendation implements OnInit {
  recommendedProducts: IProduct[] = [];
  userId: string = 'GUID_HERE'; // هنعرف إزاي نجيبه ديناميك بعدين

  // constructor(private recommendationService: RecommendationService) {}
  private recommendationService = inject(RecommendationService);

  ngOnInit(): void {
    this.loadRecommendations();
  }

  loadRecommendations(): void {
    this.recommendationService.getRecommendations(this.userId).subscribe({
      next: (products) => this.recommendedProducts = products,
      error: (err) => console.error('Error loading recommendations', err)
    });
  }
}
