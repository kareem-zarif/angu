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

  private wishlist: IProduct[] = [
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
      productPicsPathes: ['assets/519wBXYrKuL.jpg'],
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
    },
    {
      id: '4',
      name: 'High-Quality Kitchen Appliance Set',
      description: 'Modern cooking set with multiple attachments and stainless steel bowl.',
      pricePerPiece: 89.99,
      pricePer50Piece: 4200,
      pricePer100Piece: 8200,
      noInStock: 50,
      minNumToFactoryOrder: 10,
      approvalStatus: 'Approved',
      productPicsPathes: ['assets/kitchen-appliance.jpg'],
      warrantyNMonths: 24,
      shipping: 'Free',
      subCategoryId: 'kitchen',
      rating: 5,
      supplierNames: ['KitchenPro']
    },
    {
      id: '5',
      name: 'Wireless Headphones',
      description: 'Noise-cancelling over-ear headphones with long battery life.',
      pricePerPiece: 59.99,
      pricePer50Piece: 2800,
      pricePer100Piece: 5400,
      noInStock: 120,
      minNumToFactoryOrder: 5,
      approvalStatus: 'Approved',
      productPicsPathes: ['assets/headphones.jpg'],
      warrantyNMonths: 12,
      shipping: 'Paid',
      subCategoryId: 'electronics',
      rating: 4.8,
      supplierNames: ['SoundMax']
    }
  ];

  // 2. Add a getter for all products
  getProducts(): IProduct[] {
    return this.products;
  }

  getWishlist(): IProduct[] {
    return [...this.wishlist];
  }

  addToWishlist(product: IProduct): void {
    if (!this.wishlist.find(item => item.id === product.id)) {
      this.wishlist.push(product);
    }
  }

  removeFromWishlist(productId: string): void {
    this.wishlist = this.wishlist.filter(item => item.id !== productId);
  }

  clearWishlist(): void {
    this.wishlist = [];
  }

  isInWishlist(productId: string): boolean {
    return !!this.wishlist.find(item => item.id === productId);
  }
}