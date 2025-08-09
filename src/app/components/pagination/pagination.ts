import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pagination.html',
  styleUrl: './pagination.css'
})
export class Pagination implements OnChanges {
  @Input() totalItems: number = 0;
  @Input() itemsPerPage: number = 12;
  @Input() currentPage: number = 1;
  @Output() pageChange = new EventEmitter<number>();

  pages: number[] = [];
  totalPages: number = 0;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['totalItems'] || changes['itemsPerPage']) {
      this.calculatePages();
    }
  }

  calculatePages(): void {
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);

    // Generate page numbers array
    this.pages = [];

    // Always show first page
    if (this.totalPages > 0) {
      this.pages.push(1);
    }

    // Calculate range of pages to show
    let startPage = Math.max(2, this.currentPage - 1);
    let endPage = Math.min(this.totalPages - 1, this.currentPage + 1);

    // Add ellipsis after first page if needed
    if (startPage > 2) {
      this.pages.push(-1); // -1 represents ellipsis
    }

    // Add pages in range
    for (let i = startPage; i <= endPage; i++) {
      this.pages.push(i);
    }

    // Add ellipsis before last page if needed
    if (endPage < this.totalPages - 1) {
      this.pages.push(-2); // -2 represents ellipsis
    }

    // Always show last page if there is more than one page
    if (this.totalPages > 1) {
      this.pages.push(this.totalPages);
    }
  }

  changePage(page: number): void {
    if (page !== this.currentPage && page > 0 && page <= this.totalPages) {
      this.currentPage = page;
      this.pageChange.emit(page);
      this.calculatePages();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.changePage(this.currentPage - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.changePage(this.currentPage + 1);
    }
  }
}
