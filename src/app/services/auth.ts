import { Injectable } from '@angular/core';
import { environment } from '../../environment/environment';
import { BehaviorSubject, map, catchError, throwError, Observable } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { JwtHelperService } from '@auth0/angular-jwt';

export interface User {
  email: string;
  displayName: string;
  token: string;
  roles: string[];
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  requestedRole: string;
}

@Injectable({
  providedIn: 'root'
})
export class Auth {
  baseUrl = 'https://localhost:7253/api/account';
  private currentUserSource = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSource.asObservable();

  jwtHelper = new JwtHelperService();

  constructor(private http: HttpClient) {
    // تحميل المستخدم من localStorage عند بدء التطبيق
    this.loadCurrentUserFromStorage();
  }

  register(values: RegisterDto): Observable<User> {
    return this.http.post<User>(`${this.baseUrl}/register`, values).pipe(
      map((user: User) => {
        if (user && user.token) {
          this.setCurrentUser(user);
          return user;
        }
        throw new Error('Invalid response from server');
      }),
      catchError(this.handleError)
    );
  }

  login(values: LoginDto): Observable<User> {
    return this.http.post<User>(`${this.baseUrl}/login`, values).pipe(
      map((user: User) => {
        if (user && user.token) {
          this.setCurrentUser(user);
          return user;
        }
        throw new Error('Invalid response from server');
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

      // حفظ المستخدم في localStorage
      localStorage.setItem('user', JSON.stringify(user));
      this.currentUserSource.next(user);

      console.log('User set successfully:', { email: user.email, roles: user.roles });
    } catch (error) {
      console.error('Error setting current user:', error);
      this.logout();
    }
  }

  logout() {
    localStorage.removeItem('user');
    this.currentUserSource.next(null);
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

  // تنظيف الموارد عند تدمير الخدمة
  ngOnDestroy() {
    this.currentUserSource.complete();
  }


  
}
