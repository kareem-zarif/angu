import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Auth } from '../../services/auth';
import { Role } from '../../models/enums/roles';

@Injectable({
  providedIn: 'root'
})
export class AddressGuard implements CanActivate {
  constructor(private auth: Auth, private router: Router) { }

  canActivate(): boolean {
    const user = this.auth.getCurrentUser();

    if (user && [Role.Customer, Role.Seller].some(role => user.roles?.includes(role))) {
      return true;
    }

    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: '/address-management' }
      });
      return false;
    }

    this.router.navigate(['/forbidden'], {
      queryParams: {
        requiredRoles: `${Role.Customer},${Role.Seller}`,
        currentRole: user?.roles?.[0] || 'Guest'
      }
    });
    return false;
  }
}
