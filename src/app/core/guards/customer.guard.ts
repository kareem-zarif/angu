import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Auth } from '../../services/auth';
import { Role } from '../../models/enums/roles';

@Injectable({
  providedIn: 'root'
})
export class CustomerGuard implements CanActivate {
  constructor(private auth: Auth, private router: Router) { }

  canActivate(): boolean {
    const user = this.auth.getCurrentUser();

    // Only allow Customer role, explicitly deny Admin and Supplier
    if (user?.roles?.includes(Role.Customer) &&
      !user.roles.includes(Role.Admin) &&
      !user.roles.includes(Role.Supplier)) {
      return true;
    }

    this.router.navigate(['/forbidden'], {
      queryParams: {
        requiredRoles: Role.Customer,
        currentRole: user?.roles?.[0] || 'Guest',
        message: 'This feature is available for customers only'
      }
    });
    return false;
  }
}
