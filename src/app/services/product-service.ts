import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IProduct } from '../models/i-product';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  //static data
  private allProducts: IProduct[] = [
    {
      id: 'prod-001',
      name: 'روب و شبشبب قطن',
      description: 'قطن خالص من مصانع اولاد هنداوي',
      pricePerPiece: 35,
      pricePer50Piece: 25,
      pricePer100Piece:22,
      noInStock: 100,
      minNumToFactoryOrder: 50,
      approvalStatus: 'Approved',
      productPicsPathes: ['assets/1.png','assets/3.png'],
      shipping: 'Free',
      subCategoryId: 'sub-elastic-01',
      rating: 4.5
    },
    {
      id: 'prod-002',
      name: 'خشب زان',
      description: 'خشب زان اصلي بالمتر',
      pricePerPiece: 40,
      pricePer50Piece: 30,
      pricePer100Piece:25,
      noInStock: 75,
      minNumToFactoryOrder: 40,
      approvalStatus: 'Pending',
      productPicsPathes: ['assets/3.png','assets/1.png'],
      shipping: 'Paid',
      subCategoryId: 'sub-linning-02',
      rating: 4.2
    },
    {
      id: 'prod-003',
      name: 'Steel',
      description: 'Industrial grade steel components',
      pricePerPiece: 50,
      pricePer100Piece: 40,
      noInStock: 50,
      minNumToFactoryOrder: 30,
      approvalStatus: 'Approved',
      productPicsPathes: ['assets/2.png'],
      shipping: 'FreeINSameGovernate',
      subCategoryId: 'sub-steel-03',
      warrantyNMonths: 24
    },
    {
      id: 'prod-003',
      name: 'لفايف الومنيوم',
      description: 'مقاس 80*77 تشتخدم في الطهي صحية بشهدة وزارة الصحة',
      pricePerPiece: 50,
      pricePer100Piece: 40,
      noInStock: 50,
      minNumToFactoryOrder: 30,
      approvalStatus: 'Approved',
      productPicsPathes: ['assets/2.png'],
      shipping: 'FreeINSameGovernate',
      subCategoryId: 'sub-steel-03',
      warrantyNMonths: 24
    },
    {
      id: 'prod-003',
      name: 'Steel',
      description: 'Industrial grade steel components',
      pricePerPiece: 50,
      pricePer100Piece: 40,
      noInStock: 50,
      minNumToFactoryOrder: 30,
      approvalStatus: 'Approved',
      productPicsPathes: ['assets/2.png'],
      shipping: 'FreeINSameGovernate',
      subCategoryId: 'sub-steel-03',
      warrantyNMonths: 24
    },
    {
      id: 'prod-003',
      name: 'Steel',
      description: 'Industrial grade steel components',
      pricePerPiece: 50,
      pricePer100Piece: 40,
      noInStock: 50,
      minNumToFactoryOrder: 30,
      approvalStatus: 'Approved',
      productPicsPathes: ['assets/2.png'],
      shipping: 'FreeINSameGovernate',
      subCategoryId: 'sub-steel-03',
      warrantyNMonths: 24
    },
    {
      id: 'prod-003',
      name: 'Steel',
      description: 'Industrial grade steel components',
      pricePerPiece: 50,
      pricePer100Piece: 40,
      noInStock: 50,
      minNumToFactoryOrder: 30,
      approvalStatus: 'Approved',
      productPicsPathes: ['assets/2.png'],
      shipping: 'FreeINSameGovernate',
      subCategoryId: 'sub-steel-03',
      warrantyNMonths: 24
    },{
      id: 'prod-001',
      name: 'روب و شبشبب قطن',
      description: 'قطن خالص من مصانع اولاد هنداوي',
      pricePerPiece: 35,
      pricePer50Piece: 25,
      pricePer100Piece:22,
      noInStock: 100,
      minNumToFactoryOrder: 50,
      approvalStatus: 'Approved',
      productPicsPathes: ['assets/1.png','assets/3.png'],
      shipping: 'Free',
      subCategoryId: 'sub-elastic-01',
      rating: 4.5
    },
    {
      id: 'prod-002',
      name: 'خشب زان',
      description: 'خشب زان اصلي بالمتر',
      pricePerPiece: 40,
      pricePer50Piece: 30,
      pricePer100Piece:25,
      noInStock: 75,
      minNumToFactoryOrder: 40,
      approvalStatus: 'Pending',
      productPicsPathes: ['assets/3.png','assets/1.png'],
      shipping: 'Paid',
      subCategoryId: 'sub-linning-02',
      rating: 4.2
    },
    {
      id: 'prod-003',
      name: 'Steel',
      description: 'Industrial grade steel components',
      pricePerPiece: 50,
      pricePer100Piece: 40,
      noInStock: 50,
      minNumToFactoryOrder: 30,
      approvalStatus: 'Approved',
      productPicsPathes: ['assets/2.png'],
      shipping: 'FreeINSameGovernate',
      subCategoryId: 'sub-steel-03',
      warrantyNMonths: 24
    },{
      id: 'prod-001',
      name: 'روب و شبشبب قطن',
      description: 'قطن خالص من مصانع اولاد هنداوي',
      pricePerPiece: 35,
      pricePer50Piece: 25,
      pricePer100Piece:22,
      noInStock: 100,
      minNumToFactoryOrder: 50,
      approvalStatus: 'Approved',
      productPicsPathes: ['assets/1.png','assets/3.png'],
      shipping: 'Free',
      subCategoryId: 'sub-elastic-01',
      rating: 4.5
    },
    {
      id: 'prod-002',
      name: 'خشب زان',
      description: 'خشب زان اصلي بالمتر',
      pricePerPiece: 40,
      pricePer50Piece: 30,
      pricePer100Piece:25,
      noInStock: 75,
      minNumToFactoryOrder: 40,
      approvalStatus: 'Pending',
      productPicsPathes: ['assets/3.png','assets/1.png'],
      warrantyNMonths:13,
      shipping: 'Paid',
      subCategoryId: 'sub-linning-02',
      rating: 4.2
    },
    {
      id: 'prod-0037',
      name: 'Steel',
      description: 'Industrial grade steel components',
      pricePerPiece: 50,
      pricePer100Piece: 40,
      noInStock: 50,
      minNumToFactoryOrder: 30,
      approvalStatus: 'Approved',
      productPicsPathes: ['assets/2.png'],
      shipping: 'FreeINSameGovernate',
      subCategoryId: 'sub-steel-03',
      warrantyNMonths: 24
    },
    {
      id: 'prod-0035',
      name: 'Steel',
      description: 'Industrial grade steel components',
      pricePerPiece: 50,
      pricePer100Piece: 40,
      noInStock: 50,
      minNumToFactoryOrder: 30,
      approvalStatus: 'Approved',
      productPicsPathes: ['assets/2.png'],
      shipping: 'FreeINSameGovernate',
      subCategoryId: 'sub-steel-03',
      warrantyNMonths: 24
    },
    {
      id: 'prod-0033',
      name: 'Steel',
      description: 'Industrial grade steel components',
      pricePerPiece: 50,
      pricePer100Piece: 40,
      noInStock: 50,
      minNumToFactoryOrder: 30,
      approvalStatus: 'Approved',
      productPicsPathes: ['assets/2.png'],
      shipping: 'FreeINSameGovernate',
      subCategoryId: 'sub-steel-03',
      warrantyNMonths: 24
    }
  ];

  getAllDummy() {
   console.log(this.allProducts);
    return this.allProducts;
  }
  getByIdDummy(id: string) {
    if (id !== null && id !== undefined)
      return this.allProducts.find(x => x.id == id);
    else return null;
  }

  updateDummy(prod: IProduct) {
    if (prod !== null && prod !== undefined) {
      let found = this.allProducts.find(x => x.id == prod.id)
      if (found) {
        //update old product by coming product
        Object.assign(found, prod);
        return found;
      } else {
        console.warn('not found product with id' + prod.id);
        return null;
      }
    } else {
      console.warn('not valid id' + prod);
      return null;
    }
  }

  removeDummy(id: string) {
    this.allProducts = this.allProducts.filter(x => x.id != id)
    return this.allProducts;
  }

  CreateProductDummy(prod: IProduct) {
    if (!prod.id) {
      this.allProducts.push(prod);
    }
    return prod;
  }

  //---------------------------------------
  private _baseUrl = '';

  constructor(private http: HttpClient) { } //Recommended constructor pattern for feature services

  getAll(): Observable<IProduct[]> {
    return this.http.get<IProduct[]>(`${this._baseUrl}/products`);
  }

  getById(id: number): Observable<IProduct> {
    return this.http.get<IProduct>(`${this._baseUrl}/products/${id}`);
  }

  add(product: IProduct): Observable<IProduct> {
    return this.http.post<IProduct>(`${this._baseUrl}/products`, product);
  }
  update(product: IProduct): Observable<IProduct> {
    return this.http.put<IProduct>(`${this._baseUrl}/products/${product.id}`, product);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this._baseUrl}/products/${id}`);
  }

}
