import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Auth } from '../../../services/auth';

export const loginInterceptor: HttpInterceptorFn = (req, next) => {

const auth = inject(Auth);
  const currentUser = auth.getCurrentUser();

  if (currentUser && currentUser.token) {
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${currentUser.token}`
      }
    });
    return next(authReq);
  }

  return next(req);
};


