import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { Auth } from '../../services/auth';
import { Role } from '../../models/enums/roles';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private auth: Auth, private router: Router) { }

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const requiredRoles = route.data['roles'] as Role[];
    const user = this.auth.getCurrentUser();

    if (user?.roles) {
      sessionStorage.setItem('currentRole', user.roles[0]);
    }

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    if (user && user.roles) {
      const hasRequiredRole = requiredRoles.some(role =>
        user.roles.includes(role)
      );

      if (hasRequiredRole) {
        return true;
      }
    }

    this.router.navigate(['/forbidden'], {
      queryParams: {
        requiredRoles: requiredRoles.join(','),
        currentRole: user?.roles?.[0] || 'Guest'
      }
    });
    return false;
  }
}
