import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Auth } from '../../services/auth';
import { Role } from '../../models/enums/roles';

@Injectable({
  providedIn: 'root'
})
export class SellerGuard implements CanActivate {
  constructor(private auth: Auth, private router: Router) { }

  canActivate(): boolean {
    const user = this.auth.getCurrentUser();

    if (user?.roles?.includes(Role.Supplier)) {
      return true;
    }

    this.router.navigate(['/forbidden'], {
      queryParams: {
        requiredRoles: Role.Supplier,
        currentRole: user?.roles?.[0] || Role.Guest
      }
    });
    return false;
  }
}
