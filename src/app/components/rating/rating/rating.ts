import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-rating',
  imports: [CommonModule],
  templateUrl: './rating.html',
  styleUrl: './rating.css'
})
export class Rating {
  @Input() rating: number = 0;

}
