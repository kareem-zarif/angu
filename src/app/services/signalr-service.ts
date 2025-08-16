import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { HttpClient } from '@angular/common/http';
import { MessageCreateDto, MessageReadDto } from '../models/i-message';
import { environment } from '../../environment/environment';
import { BehaviorSubject } from 'rxjs';
import { Auth } from './auth';
@Injectable({
  providedIn: 'root'
})
export class SignalrService {
  private hubConnection!: signalR.HubConnection;
  private baseUrl = `${environment}`;

  private messagesSource = new BehaviorSubject<MessageReadDto[]>([]);
  public messages$ = this.messagesSource.asObservable();

  constructor(
    private http: HttpClient,
    private authService:Auth
  ) {}

 startConnection(): Promise<void> {
  // إنشاء hubConnection مع التوكن وإعادة الاتصال تلقائيًا
  this.hubConnection = new signalR.HubConnectionBuilder()
    .withUrl(`https://localhost:7253/hub/chat`, {
      accessTokenFactory: () => this.authService.getToken()
    })
    .withAutomaticReconnect()
    .build();

  // إضافة listeners قبل start() يكون أفضل أحيانًا لتجنب أي رسائل ضايعة
  this.hubConnection.on('ReceiveMessage', (message: MessageReadDto) => {
    console.log('📨 New message from SignalR:', message);
    const current = this.messagesSource.value;
    this.messagesSource.next([...current, message]);
  });

  this.hubConnection.on('MessageDeleted', (messageId: string) => {
    const updated = this.messagesSource.value.filter(m => m.id !== messageId);
    this.messagesSource.next(updated);
  });

  // بدء الاتصال وإرجاع Promise
  return this.hubConnection.start()
    .then(() => console.log('✅ SignalR connected'))
    .catch((err: any) => {
      console.error('❌ Error connecting:', err);
      return Promise.reject(err); // لإعادة رفض الـ Promise إذا حصل خطأ
    });
}


  joinGroup(customerId: string, supplierId: string): Promise<void> {
    return this.hubConnection.invoke('JoinGroup', customerId, supplierId);
  }

  sendMessage(message: MessageCreateDto) {
    return this.http.post<MessageReadDto>(`https://localhost:7253/api/message`, message);
  }

  deleteMessage(id: string) {
    return this.http.delete(`https://localhost:7253/api/message${id}`);
  }

}
