import { Injectable } from '@angular/core';
import { IProduct, ProductApprovalStatus, ShippingTypes } from '../models/i-product';

@Injectable({
  providedIn: 'root'
})
export class WishlistService {
  private wishlist: IProduct[] = [
    {
      id: '1',
      name: 'Wireless Bluetooth Headphones',
      description: 'High-quality wireless headphones with noise cancellation',
      pricePerPiece: 99.99,
      pricePer50Piece: 89.99,
      pricePer100Piece: 79.99,
      noINStock: 233,
      minNumToFactoryOrder: 50,
      approvalStatus: ProductApprovalStatus.Approved,
      warrantyNMonths: 12,
      shipping: ShippingTypes.Free,
      subCategoryId: 'electronics-001',
      rating: 4.5,
      supplierNames: ['TechCorp', 'AudioMax'],
      productPicsPathes: ["/assets/519wBXYrKuL.jpg"]
    },
    {
      id: '2',
      name: 'Smart Fitness Watch',
      description: 'Advanced fitness tracking with heart rate monitor',
      pricePerPiece: 199.99,
      pricePer50Piece: 179.99,
      pricePer100Piece: 159.99,
      noINStock: 150,
      minNumToFactoryOrder: 25,
      approvalStatus: ProductApprovalStatus.Approved,
      warrantyNMonths: 24,
      shipping: ShippingTypes.Paid,
      subCategoryId: 'wearables-001',
      rating: 4.8,
      supplierNames: ['FitTech', 'HealthGear'],
      productPicsPathes: ["/assets/519wBXYrKuL.jpg"]
    },
    {
      id: '3',
      name: 'Portable Power Bank',
      description: '20000mAh portable charger for all devices',
      pricePerPiece: 49.99,
      pricePer50Piece: 44.99,
      pricePer100Piece: 39.99,
      noINStock: 85,
      minNumToFactoryOrder: 100,
      approvalStatus: ProductApprovalStatus.Pending,
      warrantyNMonths: 6,
      shipping: ShippingTypes.FreeINSameGovernate,
      subCategoryId: 'accessories-001',
      rating: 4.2,
      supplierNames: ['PowerTech'],
      productPicsPathes: ["/assets/519wBXYrKuL.jpg"]
    }
  ];

  getWishlist(): IProduct[] {
    return this.wishlist;
  }

  addToWishlist(product: IProduct): void {
    if (!this.wishlist.find(item => item.id === product.id)) {
      this.wishlist.push(product);
    }
  }

  removeFromWishlist(productId: string): void {
    this.wishlist = this.wishlist.filter(item => item.id !== productId);
  }

  isInWishlist(productId: string): boolean {
    return this.wishlist.some(item => item.id === productId);
  }

  // Mock data for testing
  getMockProducts(): IProduct[] {
    return [
      {
        id: '4',
        name: 'Wireless Earbuds Pro',
        description: 'Premium wireless earbuds with active noise cancellation',
        pricePerPiece: 149.99,
        pricePer50Piece: 134.99,
        pricePer100Piece: 119.99,
        noINStock: 233,
        minNumToFactoryOrder: 30,
        approvalStatus: ProductApprovalStatus.Approved,
        warrantyNMonths: 18,
        shipping: ShippingTypes.Free,
        subCategoryId: 'audio-001',
        rating: 4.7,
        supplierNames: ['AudioPro', 'SoundMax'],
        productPicsPathes: ["/assets/519wBXYrKuL.jpg"]
      },
      {
        id: '5',
        name: 'Gaming Mouse RGB',
        description: 'High-precision gaming mouse with customizable RGB lighting',
        pricePerPiece: 79.99,
        pricePer50Piece: 71.99,
        pricePer100Piece: 63.99,
        noINStock: 150,
        minNumToFactoryOrder: 20,
        approvalStatus: ProductApprovalStatus.Approved,
        warrantyNMonths: 12,
        shipping: ShippingTypes.Paid,
        subCategoryId: 'gaming-001',
        rating: 4.6,
        supplierNames: ['GameTech', 'ProGaming'],
        productPicsPathes: ["/assets/519wBXYrKuL.jpg"]
      },
      {
        id: '6',
        name: 'Mechanical Keyboard',
        description: 'Cherry MX Blue switches mechanical keyboard',
        pricePerPiece: 129.99,
        pricePer50Piece: 116.99,
        pricePer100Piece: 103.99,
        noINStock: 85,
        minNumToFactoryOrder: 15,
        approvalStatus: ProductApprovalStatus.Pending,
        warrantyNMonths: 24,
        shipping: ShippingTypes.FreeINSameGovernate,
        subCategoryId: 'keyboards-001',
        rating: 4.4,
        supplierNames: ['KeyTech'],
        productPicsPathes: ["/assets/519wBXYrKuL.jpg"]
      },
      {
        id: '7',
        name: 'USB-C Hub',
        description: '7-in-1 USB-C hub with HDMI, USB, and SD card slots',
        pricePerPiece: 39.99,
        pricePer50Piece: 35.99,
        pricePer100Piece: 31.99,
        noINStock: 50,
        minNumToFactoryOrder: 50,
        approvalStatus: ProductApprovalStatus.Approved,
        warrantyNMonths: 12,
        shipping: ShippingTypes.Free,
        subCategoryId: 'accessories-002',
        rating: 4.3,
        supplierNames: ['HubTech', 'ConnectPro'],
        productPicsPathes: ["/assets/519wBXYrKuL.jpg"]
      },
      {
        id: '8',
        name: 'Wireless Charging Pad',
        description: 'Fast wireless charging pad compatible with all Qi devices',
        pricePerPiece: 29.99,
        pricePer50Piece: 26.99,
        pricePer100Piece: 23.99,
        noINStock: 120,
        minNumToFactoryOrder: 40,
        approvalStatus: ProductApprovalStatus.Approved,
        warrantyNMonths: 12,
        shipping: ShippingTypes.Free,
        subCategoryId: 'charging-001',
        rating: 4.5,
        supplierNames: ['ChargeTech', 'PowerPro'],
        productPicsPathes: ["/assets/519wBXYrKuL.jpg"]
      }
    ];
  }
}