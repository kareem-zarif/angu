import { Injectable } from '@angular/core';
import { IProduct } from '../models/i-product';

@Injectable({
  providedIn: 'root'
})
export class WishlistService {
  // 1. Define the static product list here
  private products: IProduct[] = [
    {
      id: '1',
      name: 'بلاستيك شفاف',
      description: 'مصنع أبو النمر للمنتجات البلاستيكية و الشفافة للصناعات الحديثة',
      pricePerPiece: 35,
      pricePer50Piece: 1600,
      pricePer100Piece: 3100,
      noInStock: 233,
      minNumToFactoryOrder: 100,
      approvalStatus: 'Approved',
      productPicsPathes: ["assets/519wBXYrKuL.jpg"],
      warrantyNMonths: 12,
      shipping: 'FreeINSameGovernate',
      subCategoryId: 'plastics',
      rating: 4.2,
      supplierNames: ['مصنع أبو النمر']
    },
    {
      id: '2',
      name: 'أنابيب ستانلس',
      description: 'أنابيب ستانلس عالية الجودة للصناعات المتقدمة',
      pricePerPiece: 120,
      pricePer50Piece: 5800,
      pricePer100Piece: 11000,
      noInStock: 150,
      minNumToFactoryOrder: 50,
      approvalStatus: 'Approved',
      productPicsPathes: ['assets/الفولاذ المقاوم للصدأ 310 الأنابيب.jpg'],
      warrantyNMonths: 6,
      shipping: 'Paid',
      subCategoryId: 'steels',
      rating: 4.6,
      supplierNames: ['حديدكو']
    },
    {
      id: '3',
      name: 'لفائف ألومنيوم',
      description: 'لفائف ألومنيوم للاستخدامات الصناعية والمنزلية',
      pricePerPiece: 90,
      pricePer50Piece: 4200,
      pricePer100Piece: 8200,
      noInStock: 85,
      minNumToFactoryOrder: 25,
      approvalStatus: 'Pending',
      productPicsPathes: ['assets/zzc.jpg'],
      warrantyNMonths: 3,
      shipping: 'Free',
      subCategoryId: 'aluminum',
      rating: 3.9,
      supplierNames: ['ألومكو']
    }
  ];

  private wishlist: IProduct[] = [];

  constructor() {
    // Initialize wishlist from localStorage if available
    const savedWishlist = localStorage.getItem('wishlist');
    if (savedWishlist) {
      const wishlistIds = JSON.parse(savedWishlist);
      this.wishlist = this.products.filter(p => wishlistIds.includes(p.id));
    }
  }

  // 2. Add a getter for all products
  getProducts(): IProduct[] {
    return this.products;
  }

  getWishlist(): IProduct[] {
    return [...this.wishlist];
  }

  addToWishlist(product: IProduct): void {
    if (!this.isInWishlist(product.id)) {
      this.wishlist.push(product);
      this.saveWishlist();
    }
  }

  removeFromWishlist(productId: string): void {
    this.wishlist = this.wishlist.filter(item => item.id !== productId);
    this.saveWishlist();
  }

  clearWishlist(): void {
    this.wishlist = [];
  }

  isInWishlist(productId: string): boolean {
    return !!this.wishlist.find(item => item.id === productId);
  }

  private saveWishlist() {
    const wishlistIds = this.wishlist.map(p => p.id);
    localStorage.setItem('wishlist', JSON.stringify(wishlistIds));
  }
}
