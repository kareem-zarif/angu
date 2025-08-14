import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { SellerService } from '../services/seller.service';
import { Auth } from '../services/auth';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class SellerProfileGuard implements CanActivate {
  constructor(
    private sellerService: SellerService,
    private auth: Auth,
    private router: Router
  ) {}

  canActivate(): Observable<boolean> {
    const user = this.auth.getCurrentUser();
    if (!user || !user.roles.includes('Seller')) {
      return of(true); // مش بائع → يدخل عادي
    }

    return this.sellerService.getProfileStatus().pipe(
      map(status => {
        if (status.isComplete) {
          return true;
        } else {
          this.router.navigate(['/seller-profile']);
          return false;
        }
      }),
      catchError(() => {
        this.router.navigate(['/seller-profile']);
        return of(false);
      })
    );
  }
}



//{ path: 'seller', component: SellerDashboardComponent, canActivate: [SellerProfileGuard] }

