// تحديث SellerService في Angular
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
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
  private baseUrl = environment.apiUrl;
  private profileStatusSubject = new BehaviorSubject<ProfileStatus | null>(null);
  public profileStatus$ = this.profileStatusSubject.asObservable();

  constructor(private http: HttpClient) {}

  completeProfile(data: SellerProfileData): Observable<any> {
    console.log('Sending profile data:', data);
    // تأكد من إن الـ URL صحيح
    const url = `${this.baseUrl}/ProfileSeller/complete`;
    console.log('API URL:', url);
    return this.http.post(url, data).pipe(
      tap(response => {
        console.log('Profile completion response:', response);
        // تحديث الحالة محلياً
        this.profileStatusSubject.next({
          isComplete: true,
          hasProfile: true,
          profileData: data
        });
      })
    );
  }

  getProfileStatus(): Observable<ProfileStatus> {
    return this.http.get<ProfileStatus>(`${this.baseUrl}/ProfileSeller/status`).pipe(
      tap(status => {
        console.log('Profile status:', status);
        this.profileStatusSubject.next(status);
      })
    );
  }

  // دالة مساعدة للتحقق من حالة الـ profile محلياً
  isProfileComplete(): boolean {
    const currentStatus = this.profileStatusSubject.value;
    return currentStatus?.isComplete ?? false;
  }
}
