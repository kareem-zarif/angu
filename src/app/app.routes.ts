import { Routes } from '@angular/router';
import { WishlistComponent } from './components/wishlist/wishlist';
import { OrdersComponent } from './components/orders/orders';
import { AccountManagement } from './components/account-management/account-management';
import { AboutUs } from './components/about-us/about-us';
import { CheckoutComponent } from './components/checkout/checkout';
import { AdminLayoutComponent } from './layout/admin/admin-layout';
import { AdminOrdersComponent } from './components/admin-orders/admin-orders';

export const routes: Routes = [
    { path: '', redirectTo: 'products', pathMatch: 'full' },
    { path: 'wishlist', component: WishlistComponent },
    { path: 'orders', component: OrdersComponent },
    { path: 'account-management', component: AccountManagement },
    { path: 'about-us', component: AboutUs },
    { path: 'checkout', component: CheckoutComponent },

    // Admin dashboard routes (all under shared admin layout)
    {
      path: 'admin',
      component: AdminLayoutComponent,
      children: [
        { path: 'orders', component: AdminOrdersComponent },
        { path: 'products', loadComponent: () => import('./components/admin-products/admin-products').then(m => m.AdminProductsComponent) },
        { path: 'suppliers', loadComponent: () => import('./components/admin-suppliers/admin-suppliers').then(m => m.AdminSuppliersComponent) },
        { path: 'customers', loadComponent: () => import('./components/admin-customers/admin-customers').then(m => m.AdminCustomersComponent) },
        { path: 'categories', loadComponent: () => import('./components/admin-categories/admin-categories').then(m => m.AdminCategoriesComponent) },
        { path: '', redirectTo: 'orders', pathMatch: 'full' },
      ]
    },

    { path: '**', redirectTo: 'not-found' },
];