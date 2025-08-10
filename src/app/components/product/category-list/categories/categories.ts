import { Component, EventEmitter, Output, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Category {
  id: string;
  name: string;
  img: string;
}

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './categories.html',
  styleUrl: './categories.css'
})
export class Categories implements AfterViewInit {
  @Output() categorySelected = new EventEmitter<string>();
  @ViewChild('categoriesContainer') categoriesContainer!: ElementRef;

  selectedCategoryId: string | null = null;

  categories: Category[] = [
    { id: 'blastics', name: 'Blastics', img: 'assets/images/61cI-CFN4ZL._UF894,1000_QL80_.jpg' },
    { id: 'linnings', name: 'اخشاب', img: 'assets/1.png' },
    { id: 'steels', name: 'Steels', img: 'assets/2.png' },
    { id: 'paper', name: 'Paper', img: 'assets/3.png' },
    { id: 'aluminum', name: 'Almunium', img: 'assets/4.png' },
    { id: 'plastic', name: 'Plastic', img: 'assets/images/61cI-CFN4ZL._UF894,1000_QL80_.jpg' },
    { id: 'metal', name: 'Metal', img: 'assets/1.png' },
    { id: 'wood', name: 'Wood', img: 'assets/2.png' },
    { id: 'glass', name: 'Glass', img: 'assets/3.png' },
    { id: 'ceramic', name: 'Ceramic', img: 'assets/4.png' }
  ];

  constructor() { }

  ngAfterViewInit() {
    // Initialize scroll buttons functionality
  }

  selectCategory(categoryId: string) {
    this.selectedCategoryId = categoryId;
    this.categorySelected.emit(categoryId);
  }

  scrollLeft() {
    if (this.categoriesContainer) {
      this.categoriesContainer.nativeElement.scrollBy({ left: -200, behavior: 'smooth' });
    }
  }

  scrollRight() {
    if (this.categoriesContainer) {
      this.categoriesContainer.nativeElement.scrollBy({ left: 200, behavior: 'smooth' });
    }
  }
}
