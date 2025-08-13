import { inject } from '@angular/core';
import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
} from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next: HttpHandlerFn) => {
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;

  if (user?.token) {
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${user.token}`,
      },
    });
    return next(cloned);
  }

  return next(req);
};
