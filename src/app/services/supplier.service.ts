import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ISupplier } from '../models/i-supplier';
import { IProduct } from '../models/i-product';
import { ProductService } from './product-service';

@Injectable({
  providedIn: 'root'
})
export class SupplierService {
  // Static data for suppliers
  private suppliers: ISupplier[] = [
    {
      id: 'sup-001',
      UserName: 'مصنع أبو النمر',
      Phone: '+201234567890',
      FactoryName: 'مصنع أبو النمر للمنتجات البلاستيكية',
      Description: 'متخصصون في صناعة المنتجات البلاستيكية والشفافة للصناعات الحديثة',
      Governmate: 'القاهرة',
      City: 'مدينة نصر'
    },
    {
      id: 'sup-002',
      UserName: 'حديدكو',
      Phone: '+201098765432',
      FactoryName: 'شركة حديدكو للصناعات المعدنية',
      Description: 'رائدون في مجال الصناعات المعدنية والستانلس ستيل',
      Governmate: 'الإسكندرية',
      City: 'برج العرب'
    },
    {
      id: 'sup-003',
      UserName: 'ألومكو',
      Phone: '+201112223344',
      FactoryName: 'شركة ألومكو للألومنيوم',
      Description: 'متخصصون في صناعة وتشكيل الألومنيوم للاستخدامات الصناعية والمنزلية',
      Governmate: 'القليوبية',
      City: 'شبرا الخيمة'
    },
    {
      id: 'sup-004',
      UserName: 'Max Factory',
      Phone: '+201555666777',
      FactoryName: 'Max Factory for Industrial Materials',
      Description: 'Specialized in high-quality industrial materials and components',
      Governmate: 'الجيزة',
      City: '6 أكتوبر'
    },
    {
      id: 'sup-005',
      UserName: 'لوازم مصنع البلاستيك',
      Phone: '+201222333444',
      FactoryName: 'شركة لوازم مصنع البلاستيك',
      Description: 'موردون لجميع مستلزمات مصانع البلاستيك والمواد الخام',
      Governmate: 'القاهرة',
      City: 'العبور'
    },
    {
      id: 'sup-006',
      UserName: 'الشركة المصرية للورق',
      Phone: '+201333444555',
      FactoryName: 'الشركة المصرية لصناعة الورق',
      Description: 'متخصصون في صناعة وتوريد جميع أنواع الورق والكرتون',
      Governmate: 'الشرقية',
      City: 'العاشر من رمضان'
    },
    {
      id: 'sup-007',
      UserName: 'النسيج المصري',
      Phone: '+201444555666',
      FactoryName: 'شركة النسيج المصري',
      Description: 'رواد صناعة النسيج والمنسوجات في مصر',
      Governmate: 'المنوفية',
      City: 'شبين الكوم'
    },
    {
      id: 'sup-008',
      UserName: 'الخشب الطبيعي',
      Phone: '+201666777888',
      FactoryName: 'شركة الخشب الطبيعي للأثاث',
      Description: 'متخصصون في توريد وتصنيع الأخشاب الطبيعية لصناعة الأثاث',
      Governmate: 'دمياط',
      City: 'دمياط الجديدة'
    }
  ];

  // Map of supplier products
  private supplierProducts: { [key: string]: IProduct[] } = {};

  constructor(
    private http: HttpClient,
    private productService: ProductService
  ) {
    // Initialize with product associations
    this.initializeSupplierProducts();
  }

  // Initialize supplier products with real products from ProductService
  private initializeSupplierProducts(): void {
    // Get all products from product service
    const allProducts = this.productService.getAllDummy();

    // First, assign products that already have supplier names
    allProducts.forEach(product => {
      if (product.supplierNames && product.supplierNames.length > 0) {
        product.supplierNames.forEach(supplierName => {
          const supplier = this.suppliers.find(s => s.UserName === supplierName);
          if (supplier) {
            if (!this.supplierProducts[supplier.id]) {
              this.supplierProducts[supplier.id] = [];
            }

            // Check if product is already in the array
            if (!this.supplierProducts[supplier.id].some(p => p.id === product.id)) {
              this.supplierProducts[supplier.id].push(product);
            }
          }
        });
      }
    });

    // For suppliers without products, assign some random products
    this.suppliers.forEach(supplier => {
      if (!this.supplierProducts[supplier.id] || this.supplierProducts[supplier.id].length === 0) {
        // Randomly assign 2-3 products to each supplier
        const numProducts = Math.floor(Math.random() * 2) + 2; // 2-3 products
        const supplierProducts = [];

        for (let i = 0; i < numProducts && i < allProducts.length; i++) {
          const randomIndex = Math.floor(Math.random() * allProducts.length);
          const product = { ...allProducts[randomIndex] };

          // Add supplier name to product
          if (!product.supplierNames) {
            product.supplierNames = [];
          }
          if (!product.supplierNames.includes(supplier.UserName)) {
            product.supplierNames.push(supplier.UserName);
          }

          supplierProducts.push(product);
        }

        this.supplierProducts[supplier.id] = supplierProducts;
      }
    });

    // Update the original products in ProductService with the updated supplier names
    this.updateProductsWithSupplierNames();
  }

  // Update products in ProductService with supplier names
  private updateProductsWithSupplierNames(): void {
    const allProducts = this.productService.getAllDummy();

    // Collect all supplier associations
    const productSuppliers: { [productId: string]: string[] } = {};

    Object.entries(this.supplierProducts).forEach(([supplierId, products]) => {
      const supplier = this.suppliers.find(s => s.id === supplierId);
      if (supplier) {
        products.forEach(product => {
          if (!productSuppliers[product.id]) {
            productSuppliers[product.id] = [];
          }
          if (!productSuppliers[product.id].includes(supplier.UserName)) {
            productSuppliers[product.id].push(supplier.UserName);
          }
        });
      }
    });

    // Update products in ProductService
    allProducts.forEach(product => {
      if (productSuppliers[product.id]) {
        product.supplierNames = productSuppliers[product.id];
      }
    });
  }

  // Get all suppliers
  getAllSuppliers(): ISupplier[] {
    return [...this.suppliers];
  }

  // Get supplier by ID
  getSupplierById(id: string): ISupplier | null {
    return this.suppliers.find(supplier => supplier.id === id) || null;
  }

  // Get supplier by name
  getSupplierByName(name: string): ISupplier | null {
    return this.suppliers.find(supplier => supplier.UserName === name) || null;
  }

  // Get products for a specific supplier
  getSupplierProducts(supplierId: string): IProduct[] {
    return this.supplierProducts[supplierId] || [];
  }

  // Get products for a supplier by name
  getProductsBySupplierName(supplierName: string): IProduct[] {
    const supplier = this.getSupplierByName(supplierName);
    if (supplier) {
      return this.getSupplierProducts(supplier.id);
    }
    return [];
  }

  // Filter suppliers by city
  filterSuppliersByCity(city: string): ISupplier[] {
    if (!city) return [...this.suppliers];
    return this.suppliers.filter(supplier =>
      supplier.City.toLowerCase().includes(city.toLowerCase())
    );
  }

  // Filter suppliers by governorate
  filterSuppliersByGovernorate(governorate: string): ISupplier[] {
    if (!governorate) return [...this.suppliers];
    return this.suppliers.filter(supplier =>
      supplier.Governmate.toLowerCase().includes(governorate.toLowerCase())
    );
  }

  // Search suppliers by name
  searchSuppliers(query: string): ISupplier[] {
    if (!query) return [...this.suppliers];
    const lowerQuery = query.toLowerCase();
    return this.suppliers.filter(supplier =>
      supplier.UserName.toLowerCase().includes(lowerQuery) ||
      supplier.FactoryName.toLowerCase().includes(lowerQuery) ||
      supplier.Description.toLowerCase().includes(lowerQuery)
    );
  }

  // Get all cities
  getAllCities(): string[] {
    return [...new Set(this.suppliers.map(supplier => supplier.City))];
  }

  // Get all governorates
  getAllGovernorates(): string[] {
    return [...new Set(this.suppliers.map(supplier => supplier.Governmate))];
  }

  // API methods for future implementation
  getAll(): Observable<ISupplier[]> {
    return this.http.get<ISupplier[]>(`/api/suppliers`);
  }

  getById(id: string): Observable<ISupplier> {
    return this.http.get<ISupplier>(`/api/suppliers/${id}`);
  }

  create(supplier: ISupplier): Observable<ISupplier> {
    return this.http.post<ISupplier>(`/api/suppliers`, supplier);
  }

  update(supplier: ISupplier): Observable<ISupplier> {
    return this.http.put<ISupplier>(`/api/suppliers/${supplier.id}`, supplier);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`/api/suppliers/${id}`);
  }
}
