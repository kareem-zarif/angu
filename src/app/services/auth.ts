import { Injectable } from '@angular/core';
import { environment } from '../../environment/environment';
import { BehaviorSubject, map, catchError, throwError, Observable, tap, exhaustMap, switchMap, of } from 'rxjs';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { JwtHelperService } from '@auth0/angular-jwt';
import { WishlistService } from './wishlistService';
import { CartService } from './cart.service';
import { OrdersService } from './orders-service';
import { ISupplierRegister } from '../models/isupplier-register';
import { ICustomerRegister } from '../models/icustomer-register';

export interface User {
  UserId: string;
  email: string;
  displayName: string;
  sellerName?: string; // Add seller name field
  token: string;
  roles: string[];
  isAuthenticated: boolean;
}

export interface LoginDto {
  email: string;
  password: string;
}


@Injectable({
  providedIn: 'root'
})
export class Auth {
  baseUrl = `${environment.apiUrl}/Account`;
  private currentUserSource = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSource.asObservable();

  jwtHelper = new JwtHelperService();

  constructor(
    private http: HttpClient,
    private wishlistService: WishlistService,
    private cartService: CartService,
    private ordersService: OrdersService
  ) {
    // تحميل المستخدم من localStorage عند بدء التطبيق
    this.loadCurrentUserFromStorage();
  }

  registerCustomer(payload: ICustomerRegister): Observable<any> {
    // backend expects /register/customer
    return this.http.post(`${this.baseUrl}/register/customer`, payload);
  }
  registerSupplier(payload: ISupplierRegister): Observable<any> {
    return this.http.post(`${this.baseUrl}/register/supplier`, payload);
  }


  login(values: LoginDto): Observable<User> {
    this.cartService.clearCache(); // Clear cache before login
    return this.http.post<User>(`${this.baseUrl}/login`, values).pipe(
      map((response: any) => {
        if (response && response.token) {
          const user: User = {
            UserId: response.UserId,
            email: response.email,
            displayName: response.displayName,
            sellerName: response.sellerName || response.displayName, // Extract seller name
            token: response.token,
            isAuthenticated: true,
            roles: []
          };
          this.setCurrentUser(user);
          return user;
        }
        throw new Error('Invalid response from server');
      }),
      exhaustMap((user: User) => {
        const customerId = user.UserId;
        if (!customerId) return of(user);

        return this.wishlistService.ensureWishlistExists(customerId).pipe(
          tap(wishlist => {
            console.log('✅ Wishlist ensured or created:', wishlist.id);
          }),
          switchMap((wishlist) =>
            this.wishlistService.syncLocalWishlistWithApi(customerId, wishlist.id).pipe(
              tap(() => console.log('✅ Local wishlist synced with server'))
            )
          ),
          switchMap(() =>
            this.cartService.ensureCartExists(customerId, true).pipe( // Force refresh
              tap(cart => {
                console.log('🛒 Cart ensured or created:', cart.id);
              }),
              switchMap(() =>
                this.cartService.syncLocalCartWithApi(customerId).pipe(
                  tap(() => console.log('🛒 Local cart synced with server'))
                )
              )
            )
          ), switchMap(() =>
            this.ordersService.getOrders().pipe(
              tap(orders => console.log('✅ Orders loaded:', orders.length)),
              map(() => user)
            )
          ),
          map(() => user),
          catchError(err => {
            console.error('❌ Error with wishlist/cart/orders:', err);
            return of(user);
          })
        );
      }),
      catchError(this.handleError)
    );
  }





  setCurrentUser(user: User) {
    try {
      // التحقق من صحة التوكن قبل فك تشفيره
      if (!user.token || this.jwtHelper.isTokenExpired(user.token)) {
        console.warn('Token is invalid or expired');
        this.logout();
        return;
      }

      const decodedToken = this.jwtHelper.decodeToken(user.token);

      // استخراج الأدوار من التوكن
      if (decodedToken && decodedToken['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']) {
        const roles = decodedToken['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
        user.roles = Array.isArray(roles) ? roles : [roles];
      } else if (decodedToken && decodedToken['role']) {
        // fallback للتوافق مع تنسيقات مختلفة
        user.roles = Array.isArray(decodedToken['role'])
          ? decodedToken['role']
          : [decodedToken['role']];
      } else {
        user.roles = [];
      }

      // ✅ استخراج الـ nameid من التوكن
      if (decodedToken && decodedToken['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier']) {
        user.UserId = decodedToken['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
      } else if (decodedToken && decodedToken['nameid']) {
        // fallback للتوافق مع تنسيقات أبسط
        user.UserId = decodedToken['nameid'];
      }

      // Extract seller name from token if available
      if (decodedToken && decodedToken['sellerName']) {
        user.sellerName = decodedToken['sellerName'];
      } else if (decodedToken && decodedToken['displayName']) {
        user.sellerName = decodedToken['displayName'];
      }

      // حفظ المستخدم في localStorage
      localStorage.setItem('user', JSON.stringify(user));
      this.currentUserSource.next(user);

      console.log('User set successfully:', { UserId: user.UserId, email: user.email, roles: user.roles, token: user.token });
    } catch (error) {
      console.error('Error setting current user:', error);
      this.logout();
    }
  }

  logout() {
    localStorage.removeItem('user');
    this.currentUserSource.next(null);
    this.wishlistService.clearCache(); // ✨
    console.log('cache Cleared');
    console.log('User logged out');
  }

  loadCurrentUserFromStorage() {
    try {
      const userString = localStorage.getItem('user');
      if (userString) {
        const user: User = JSON.parse(userString);

        // التحقق من صحة التوكن المحفوظ
        if (user.token && !this.jwtHelper.isTokenExpired(user.token)) {
          this.setCurrentUser(user);
        } else {
          // إزالة التوكن المنتهي الصلاحية
          console.log('Stored token is expired, removing...');
          this.logout();
        }
      }
    } catch (error) {
      console.error('Error loading user from storage:', error);
      this.logout();
    }
  }

  // التحقق من وجود المستخدم
  isLoggedIn(): boolean {
    const currentUser = this.currentUserSource.value;
    return currentUser !== null &&
      currentUser.token !== null &&
      !this.jwtHelper.isTokenExpired(currentUser.token);
  }

  // الحصول على المستخدم الحالي
  getCurrentUser(): User | null {
    return this.currentUserSource.value;
  }

  // التحقق من الدور
  hasRole(role: string): boolean {
    const currentUser = this.getCurrentUser();
    return currentUser?.roles?.includes(role) || false;
  }

  // التحقق من وجود أي من الأدوار المحددة
  hasAnyRole(roles: string[]): boolean {
    const currentUser = this.getCurrentUser();
    if (!currentUser?.roles) return false;

    return roles.some(role => currentUser.roles.includes(role));
  }

  // الحصول على معلومات المستخدم من الخادم
  getCurrentUserFromServer(): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}`).pipe(
      map((user: User) => {
        if (user) {
          this.setCurrentUser(user);
        }
        return user;
      }),
      catchError(this.handleError)
    );
  }

  // معالجة الأخطاء
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'حدث خطأ غير متوقع';

    if (error.error instanceof ErrorEvent) {
      // خطأ من جانب العميل
      errorMessage = `خطأ: ${error.error.message}`;
    } else {
      // خطأ من جانب الخادم
      if (error.status === 401) {
        errorMessage = 'بيانات تسجيل الدخول غير صحيحة';
      } else if (error.status === 400) {
        if (error.error?.errors && Array.isArray(error.error.errors)) {
          errorMessage = error.error.errors.join(', ');
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        } else {
          errorMessage = 'البيانات المدخلة غير صحيحة';
        }
      } else if (error.status === 500) {
        errorMessage = 'خطأ في الخادم، يرجى المحاولة لاحقاً';
      } else if (error.status === 0) {
        errorMessage = 'لا يمكن الاتصال بالخادم';
      }
    }

    console.error('Auth Service Error:', error);
    return throwError(() => new Error(errorMessage));
  }

  getToken(): string {
    const currentUser = this.currentUserSource.value;
    return currentUser?.token || '';
  };

  getUserId(): string | null {
    return this.currentUserSource.value?.UserId ?? null;
  }

  getSellerName(): string | null {
    return this.currentUserSource.value?.sellerName ?? null;
  }

  getRoles(): string[] {
    return this.currentUserSource.value?.roles ?? [];
  }

  // تنظيف الموارد عند تدمير الخدمة
  ngOnDestroy() {
    this.currentUserSource.complete();
  }
  //kemo wishlsit
}
