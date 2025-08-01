import { Routes } from '@angular/router';
import { WishlistComponent } from './components/wishlist/wishlist';
import { OrdersComponent } from './components/orders/orders';
import { ProductList } from './components/product/product-list/product-list';
import { ProductDetails } from './components/product/product-details/product-details';
import { Cart } from './components/cart/cart';
import { SupplierList } from './components/supplier/supplier-list/supplier-list';

export const routes: Routes = [
  { path: 'wishlist', component: WishlistComponent },
  { path: 'orders', component: OrdersComponent },
  { path: 'products', component: ProductList },
  { path: 'products/:id', component: ProductDetails },
  { path: 'cart', component: Cart },
  { path: 'suppliers', component: SupplierList },

  { path: '', redirectTo: 'products', pathMatch: 'full' },

  { path: '**', redirectTo: 'not-found' },
];
