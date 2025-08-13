import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../environment/environment';

export interface SellerProfileData {
  storeName: string;
  businessType: string;
  description: string;
  phoneNumber: string;
  address: string;
  websiteUrl?: string;
  storeLogoUrl?: string;
}

export interface ProfileStatus {
  isComplete: boolean;
  hasProfile: boolean;
  profileData?: SellerProfileData;
}

@Injectable({
  providedIn: 'root'
})
export class SellerService {
  private readonly baseUrl = `${environment.apiUrl}/ProfileSeller`;
  private profileStatusSubject = new BehaviorSubject<ProfileStatus | null>(null);
  public profileStatus$ = this.profileStatusSubject.asObservable();

  constructor(private http: HttpClient) {}

  /** إنشاء بروفايل جديد */
  completeProfile(data: SellerProfileData): Observable<any> {
    return this.http.post(`${this.baseUrl}/complete`, data).pipe(
      tap(() => {
        this.profileStatusSubject.next({
          isComplete: true,
          hasProfile: true,
          profileData: data
        });
      }),
      catchError(err => {
        console.error('Error completing profile:', err);
        throw err;
      })
    );
  }

  /** تحديث البروفايل الحالي */
  updateProfile(data: SellerProfileData): Observable<any> {
    return this.http.put(`${this.baseUrl}/update`, data).pipe(
      tap(() => {
        const currentStatus = this.profileStatusSubject.value;
        this.profileStatusSubject.next({
          isComplete: true,
          hasProfile: true,
          profileData: data
        });
      }),
      catchError(err => {
        console.error('Error updating profile:', err);
        throw err;
      })
    );
  }

  /** جلب حالة البروفايل */
  getProfileStatus(forceRefresh = false): Observable<ProfileStatus> {
    if (!forceRefresh && this.profileStatusSubject.value) {
      return of(this.profileStatusSubject.value);
    }
    return this.http.get<ProfileStatus>(`${this.baseUrl}/status`).pipe(
      tap(status => this.profileStatusSubject.next(status)),
      catchError(err => {
        console.error('Error fetching profile status:', err);
        throw err;
      })
    );
  }

  /** التحقق إذا البروفايل مكتمل */
  isProfileComplete(): boolean {
    return this.profileStatusSubject.value?.isComplete ?? false;
  }
}
