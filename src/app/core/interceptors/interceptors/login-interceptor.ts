import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Auth } from '../../../services/auth';
import { take, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

export const loginInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(Auth);

  return auth.currentUser$.pipe(
    take(1), // ناخد آخر قيمة فقط
    switchMap(currentUser => {
      if (currentUser && currentUser.token) {
        const authReq = req.clone({
          setHeaders: {
            Authorization: `Bearer ${currentUser.token}`
          }
        });
        return next(authReq);
      }
      return next(req);
    })
  );
};
