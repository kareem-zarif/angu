import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { Auth } from '../../services/auth';
import { Role } from '../../models/enums/roles';

@Injectable({
  providedIn: 'root'
})
export class SignalrGuard implements CanActivate {
  constructor(private auth: Auth, private router: Router) { }

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const user = this.auth.getCurrentUser();
    const supplierId = route.params['supplierId'];

    // Allow access if user is a customer and there's a supplierId (contacting supplier)
    if (user?.roles?.includes(Role.Customer) && supplierId) {
      return true;
    }

    // Allow access if user is either customer or supplier for general chat
    if (user && [Role.Customer, Role.Supplier].some(role => user.roles?.includes(role))) {
      return true;
    }

    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: `/chat/signalr/${supplierId || ''}` }
      });
      return false;
    }

    this.router.navigate(['/forbidden'], {
      queryParams: {
        requiredRoles: `${Role.Customer},${Role.Supplier}`,
        currentRole: user?.roles?.[0] || 'Guest'
      }
    });
    return false;
  }
}
