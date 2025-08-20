import { Injectable } from '@angular/core';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root'
})
export class DecJwt {
  constructor() {}

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getUserIdFromToken(): string | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const decoded: any = jwtDecode(token);
      // حسب التوكن بتاعك ممكن يكون nameid أو sub أو id
      return decoded?.nameid || decoded?.sub || decoded?.id || null;
    } catch (err) {
      console.error('Token decoding failed', err);
      return null;
    }
  }

  getCurrentUser(): { id: string; email?: string } | null {
    const token = this.getToken();
    if (!token) return null;

    const decoded: any = jwtDecode(token);
    return {
      id: decoded?.nameid || decoded?.sub || decoded?.id,
      email: decoded?.email
    };
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    localStorage.removeItem('token');
  }
}
