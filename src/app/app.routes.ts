import { Routes } from '@angular/router';
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



export const routes: Routes = [
  // Default route
  { path: '', redirectTo: 'products', pathMatch: 'full' },

  // Auth routes
  { path: 'login', component: Login },
  { path: 'register', component: RegisterComponent },
  { path: 'register-selection', component: RegisterSelection },
  { path: 'recommendation', component: Recommendation },

  { path: 'notification-test', loadComponent: () => import('./components/notification-test/notification-test').then(m => m.NotificationTestComponent) },


  // Main content routes
  { path: 'products', component: ProductList },
  { path: 'products/:id', component: ProductDetails },
  { path: 'suppliers', component: SupplierList },
  { path: 'about-us', component: AboutUs },

  // User account routes
  { path: 'wishlist', component: WishlistComponent },
  { path: 'orders', component: OrdersComponent },
  { path: 'account-management', component: AccountManagement },
  { path: 'address-management', loadComponent: () => import('./components/address-management/address-management').then(m => m.AddressManagement) },
  { path: 'cart', component: Cart },
  { path: 'checkout', component: CheckoutComponent },

  // Payment Routes
  { path: 'payment', component: PaymentComponent },
  { path: 'paymentCancel', component: PaymentCancel },

  //signalr routes
  { path: 'signalr', component: SignalrChat },
  { path: 'chat/:supplierId', component: SignalrChat },
  //chatbot routes
  { path: 'chatbot', component: Chatbot },
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
      },
      {
        path: 'subcategories',
        loadComponent: () => import('./components/admin-subcategories/admin-subcategories')
          .then(m => m.AdminSubCategoriesComponent)
      }
    ]
  },

  // Seller routes
  {
    path: 'seller',
    component: SellerLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./components/seller-dashboard/seller-dashboard')
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
      }
    ]
  },

  // Wildcard route for 404
  { path: '**', redirectTo: 'not-found' }
];
