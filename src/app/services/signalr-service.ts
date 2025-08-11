import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { HttpClient } from '@angular/common/http';
import { MessageCreateDto, MessageReadDto } from '../models/i-message';
import { environment } from '../../environment/environment';

import { BehaviorSubject } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class SignalrService {
  private hubConnection!: signalR.HubConnection;
  private baseUrl = `${environment}`; 

  private messagesSource = new BehaviorSubject<MessageReadDto[]>([]);
  public messages$ = this.messagesSource.asObservable();

  constructor(private http: HttpClient) {}

  startConnection(): void {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${this.baseUrl}/hub/chat`)
      .withAutomaticReconnect()
      .build();

    this.hubConnection
      .start()
      .then(() => console.log('✅ SignalR connected'))
      .catch(err => console.error('❌ Error connecting:', err));

    this.hubConnection.on('ReceiveMessage', (message: MessageReadDto) => {
     console.log('📨 New message from SignalR:', message);
      const current = this.messagesSource.value;
      this.messagesSource.next([...current, message]);
    });

    this.hubConnection.on('MessageDeleted', (messageId: string) => {
      const updated = this.messagesSource.value.filter(m => m.id !== messageId);
      this.messagesSource.next(updated);
    });
  }

  joinGroup(customerId: string, supplierId: string): Promise<void> {
    return this.hubConnection.invoke('JoinGroup', customerId, supplierId);
  }

  sendMessage(message: MessageCreateDto) {
    return this.http.post<MessageReadDto>(`${this.baseUrl}/api/message`, message);
  }

  deleteMessage(id: string) {
    return this.http.delete(`${this.baseUrl}/api/message/${id}`);
  }
}
