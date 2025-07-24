import { Routes } from '@angular/router';
import { WishlistComponent } from './components/wishlist/wishlist';
import { OrdersComponent } from './components/orders/orders';

export const routes: Routes = [
    { path: '', redirectTo: 'products', pathMatch: 'full' },
    { path: '**', redirectTo: 'not-found' },
    { path: 'wishlist', component: WishlistComponent },
    { path: 'orders', component: OrdersComponent },
];
