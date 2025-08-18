import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Auth } from '../../services/auth';
import { Role } from '../../models/enums/roles';

@Injectable({
  providedIn: 'root'
})
export class CustomerGuard implements CanActivate {
  constructor(private auth: Auth, private router: Router) {}

  canActivate(): boolean {
    const user = this.auth.getCurrentUser();

    if (!user || user.roles?.includes(Role.Customer)) {
      return true;
    }

    this.router.navigate(['/forbidden'], {
      queryParams: {
        requiredRoles: `${Role.Customer},${Role.Guest}`,
        currentRole: user.roles?.[0]
      }
    });
    return false;
  }
}
