import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MessageReadDto, MessageCreateDto } from '../models/i-message';
import { environment } from '../../environment/environment';

export interface CustomerConversation {
  customerId: string;
  customerName: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  messages: MessageReadDto[];
}

@Injectable({
  providedIn: 'root'
})
export class SellerMessageService {
  private baseUrl = `${environment.apiUrl}/Message`;

  constructor(private http: HttpClient) { }

  // Get all messages for a supplier
  getMessagesBySupplier(supplierId: string): Observable<MessageReadDto[]> {
    return this.http.get<MessageReadDto[]>(`${this.baseUrl}/bysupplier/${supplierId}`);
  }

  // Get all messages
  getAllMessages(): Observable<MessageReadDto[]> {
    return this.http.get<MessageReadDto[]>(`${this.baseUrl}`);
  }

  // Get a specific message
  getMessage(id: string): Observable<MessageReadDto> {
    return this.http.get<MessageReadDto>(`${this.baseUrl}/${id}`);
  }

  // Create a new message
  createMessage(message: MessageCreateDto): Observable<MessageReadDto> {
    return this.http.post<MessageReadDto>(`${this.baseUrl}`, message);
  }

  // Update a message
  updateMessage(message: any): Observable<MessageReadDto> {
    return this.http.put<MessageReadDto>(`${this.baseUrl}`, message);
  }

  // Delete a message
  deleteMessage(id: string): Observable<MessageReadDto> {
    return this.http.delete<MessageReadDto>(`${this.baseUrl}/${id}`);
  }

  // Get conversations grouped by customer for a supplier
  getCustomerConversations(supplierId: string): Observable<CustomerConversation[]> {
    return new Observable(observer => {
      this.getMessagesBySupplier(supplierId).subscribe({
        next: (messages) => {
          const conversations = this.groupMessagesByCustomer(messages, supplierId);
          observer.next(conversations);
          observer.complete();
        },
        error: (error) => {
          observer.error(error);
        }
      });
    });
  }

  // Group messages by customer and create conversation objects
  private groupMessagesByCustomer(messages: MessageReadDto[], supplierId: string): CustomerConversation[] {
    const customerGroups = new Map<string, MessageReadDto[]>();

    // Group messages by customer
    messages.forEach(message => {
      const customerId = message.customerId;
      if (customerId) {
        if (!customerGroups.has(customerId)) {
          customerGroups.set(customerId, []);
        }
        customerGroups.get(customerId)!.push(message);
      }
    });

    // Create conversation objects
    const conversations: CustomerConversation[] = [];
    customerGroups.forEach((customerMessages, customerId) => {
      // Sort messages by date
      const sortedMessages = customerMessages.sort((a, b) => 
        new Date(a.messageDateTime).getTime() - new Date(b.messageDateTime).getTime()
      );

      const lastMessage = sortedMessages[sortedMessages.length - 1];
      const unreadCount = customerMessages.filter(m => 
        m.senderType.toLowerCase() === 'customer' && 
        (m.isRead === undefined || !m.isRead) // Handle cases where isRead might not exist
      ).length;

      conversations.push({
        customerId: customerId,
        customerName: lastMessage.customerName || 'Unknown Customer',
        lastMessage: lastMessage.body,
        lastMessageTime: lastMessage.messageDateTime,
        unreadCount: unreadCount,
        messages: sortedMessages
      });
    });

    // Sort conversations by last message time (newest first)
    return conversations.sort((a, b) => 
      new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
    );
  }
}
