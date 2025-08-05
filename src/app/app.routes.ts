import { Routes } from '@angular/router';
import { WishlistComponent } from './components/wishlist/wishlist';
import { OrdersComponent } from './components/orders/orders';
import { AccountManagement } from './components/account-management/account-management';
import { CheckoutComponent } from './components/checkout/checkout';
import { AdminLayoutComponent } from './layout/admin/admin-layout';
import { AdminOrdersComponent } from './components/admin-orders/admin-orders';
import { AboutUs } from './components/about-us/about-us';
import { RegisterSelection } from './components/register-selection/register-selection';
import { Register } from './components/register/register';
import { Login } from './components/login/login';
import { ProductList } from './components/product/product-list/product-list';
import { ProductDetails } from './components/product/product-details/product-details';
import { Cart } from './components/cart/cart';
import { SupplierList } from './components/supplier/supplier-list/supplier-list';
import { Recommendation } from './components/recommendation/recommendation';

export const routes: Routes = [
  // Default route
  { path: '', redirectTo: 'products', pathMatch: 'full' },

  // Auth routes
  { path: 'login', component: Login },
  { path: 'register-selection', component: RegisterSelection },
  { path: 'register', component: Register },
  { path: 'recommendation', component: Recommendation },

  // Main content routes
  { path: 'products', component: ProductList },
  { path: 'products/:id', component: ProductDetails },
  { path: 'suppliers', component: SupplierList },
  { path: 'about-us', component: AboutUs },

  // User account routes
  { path: 'wishlist', component: WishlistComponent },
  { path: 'orders', component: OrdersComponent },
  { path: 'account-management', component: AccountManagement },
  { path: 'cart', component: Cart },
  { path: 'checkout', component: CheckoutComponent },

  // Admin routes
  {
    path: 'admin',
    component: AdminLayoutComponent,
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
      }
    ]
  },

  // Wildcard route for 404
  { path: '**', redirectTo: 'not-found' }
];
