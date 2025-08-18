import { Routes } from '@angular/router';
import { Role } from './models/enums/roles';
import { AuthGuard } from './core/guards/auth.guard';
import { AdminGuard } from './core/guards/admin.guard';
import { SellerGuard } from './core/guards/seller.guard';
import { OrdersComponent } from './components/orders/orders';
import { AccountManagement } from './components/account-management/account-management';
import { CheckoutComponent } from './components/checkout/checkout';
import { AdminLayoutComponent } from './layout/admin/admin-layout';
import { AdminOrdersComponent } from './components/admin-orders/admin-orders';
import { AboutUs } from './components/about-us/about-us';
import { RegisterSelection } from './components/register-selection/register-selection';
import { Login } from './components/login/login';
import { ProductList } from './components/product/product-list/product-list';
import { ProductDetails } from './components/product/product-details/product-details';
import { Cart } from './components/cart/cart';
import { SupplierList } from './components/supplier/supplier-list/supplier-list';
import { WishlistComponent } from './components/wishlist/wishlist';
import { Recommendation } from './components/recommendation/recommendation';
import { SellerLayoutComponent } from './layout/seller/seller-layout';
import { PaymentComponent } from './components/payment/payment/payment';
import { SignalrChat } from './components/signalr-chat/signalr-chat';
import { Chatbot } from './components/chatbot/chatbot';
import { PaymentCancel } from './components/payment/payment-cancel/payment-cancel';
import { RegisterComponent } from './components/register/register';
import { BestSellers } from './components/best-sellers/best-sellers';
import { NewReleases } from './components/new-releases/new-releases';
import { ForbiddenComponent } from './components/shared/forbidden/forbidden';
import { CustomerGuard } from './core/guards/customer.guard';
import { AddressGuard } from './core/guards/address.guard';



export const routes: Routes = [
  // Public routes
  { path: '', redirectTo: 'products', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'register', component: RegisterComponent },
  { path: 'register-selection', component: RegisterSelection },
  { path: 'about-us', component: AboutUs },
  { path: 'forbidden', component: ForbiddenComponent },
  { path: 'bestsellers', component: BestSellers },
  { path: 'newreleases', component: NewReleases },
  { path: 'suppliers', component: SupplierList },
  { path: 'cart', component: Cart },
  { path: 'wishlist', component: WishlistComponent },
  { path: 'products', component: ProductList },
  { path: 'products/:id', component: ProductDetails },
  { path: 'recommendation', component: Recommendation },

  // Customer routes
  {
    path: 'customer',
    canActivate: [CustomerGuard],
    children: [
      { path: 'orders', component: OrdersComponent },
      { path: 'checkout', component: CheckoutComponent },
      { path: 'address-management', loadComponent: () => import('./components/address-management/address-management').then(m => m.AddressManagement) }
    ]
  },

  // Admin routes
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [AdminGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./components/admin-dashboard/admin-dashboard')
          .then(m => m.AdminDashboardComponent)
      },
      { path: 'orders', component: AdminOrdersComponent },
      {
        path: 'products',
        loadComponent: () => import('./components/admin-products/admin-products')
          .then(m => m.AdminProductsComponent)
      },
      {
        path: 'suppliers',
        loadComponent: () => import('./components/admin-suppliers/admin-suppliers')
          .then(m => m.AdminSuppliersComponent)
      },
      {
        path: 'suppliers/details/:id',
        loadComponent: () => import('./components/admin-suppliers/supplier-details/supplier-details')
          .then(m => m.SupplierDetailsComponent)
      },
      {
        path: 'customers',
        loadComponent: () => import('./components/admin-customers/admin-customers')
          .then(m => m.AdminCustomersComponent)
      },
      {
        path: 'categories',
        loadComponent: () => import('./components/admin-categories/admin-categories')
          .then(m => m.AdminCategoriesComponent)
      },
      {
        path: 'subcategories',
        loadComponent: () => import('./components/admin-subcategories/admin-subcategories')
          .then(m => m.AdminSubCategoriesComponent)
      },
      {
        path: 'admins',
        loadComponent: () => import('./components/admin-management')
          .then(m => m.AdminManagementComponent)
      }
    ]
  },

  // Seller routes
  {
    path: 'seller',
    component: SellerLayoutComponent,
    canActivate: [SellerGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./components/seller-dashboard')
          .then(m => m.SellerDashboardComponent)
      },
      {
        path: 'products',
        loadComponent: () => import('./components/seller-products/seller-products')
          .then(m => m.SellerProductsComponent)
      },
      {
        path: 'orders',
        loadComponent: () => import('./components/seller-orders/seller-orders')
          .then(m => m.SellerOrdersComponent)
      },
      {
        path: 'reports',
        loadComponent: () => import('./components/seller-reports/seller-reports')
          .then(m => m.SellerReportsComponent)
      },
      {
        path: 'payouts',
        loadComponent: () => import('./components/seller-payouts/seller-payouts')
          .then(m => m.SellerPayoutsComponent)
      },
      {
        path: 'customers',
        loadComponent: () => import('./components/seller-customers/seller-customers')
          .then(m => m.SellerCustomersComponent)
      },
      {
        path: 'promotions',
        loadComponent: () => import('./components/seller-promotions/seller-promotions')
          .then(m => m.SellerPromotionsComponent)
      },

      {
        path: 'compliance',
        loadComponent: () => import('./components/seller-compliance/seller-compliance')
          .then(m => m.SellerComplianceComponent)
      },
      {
        path: 'addresses',
        loadComponent: () => import('./components/seller-address-management/seller-address-management')
          .then(m => m.SellerAddressManagementComponent)
      }
    ]
  },

  // Address Management Route
  {
    path: 'address-management',
    canActivate: [AddressGuard],
    loadComponent: () => import('./components/address-management/address-management')
      .then(m => m.AddressManagement)
  },

  // Customer Address Management
  {
    path: 'customer/address-management',
    canActivate: [AddressGuard],
    loadComponent: () => import('./components/address-management/address-management')
      .then(m => m.AddressManagement)
  },

  // Seller Address Management
  {
    path: 'seller/address-management',
    canActivate: [AddressGuard],
    loadComponent: () => import('./components/seller-address-management/seller-address-management')
      .then(m => m.SellerAddressManagementComponent)
  },

  // Wildcard route
  { path: '**', redirectTo: 'not-found' }
];
