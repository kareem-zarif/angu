import { Component, ElementRef, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { SignalrService } from '../../services/signalr-service';
import { MessageCreateDto, MessageReadDto } from '../../models/i-message';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ISupplier } from '../../models/i-supplier';
import { HttpClient } from '@angular/common/http';
import { Auth } from '../../services/auth';
import { Subscription } from 'rxjs';
import { environment } from '../../../environment/environment';

@Component({
  selector: 'app-signalr-chat',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './signalr-chat.html',
  styleUrls: ['./signalr-chat.css']
})
export class SignalrChat implements OnInit, OnDestroy {
  senderType: 'Customer' | 'Supplier' = 'Customer';
  senderId: string = '';
  receiverId: string = '';
  messageBody: string = '';
  messages: MessageReadDto[] = [];
  supplier: ISupplier | null = null;
  quantity: number = 100;
  @ViewChild('chatContainer') private chatContainer!: ElementRef;

  private subscription: Subscription | null = null;
  private apiUrl = `${environment.apiUrl}/Supplier`;

  constructor(
    private chatService: SignalrService,
    private route: ActivatedRoute,
    private auth: Auth,
    private http: HttpClient,
  ) {}

  ngOnInit(): void {
    this.subscription = this.auth.currentUser$.subscribe(user => {
      if (user) {
        if (user.roles.includes('Customer')) {
          this.senderType = 'Customer';
        } else if (user.roles.includes('Supplier')) {
          this.senderType = 'Supplier';
        }
        this.senderId = user.UserId;
        this.receiverId = this.route.snapshot.paramMap.get(
          this.senderType === 'Customer' ? 'supplierId' : 'customerId'
        ) || '';

        this.loadSupplier();

        // Start SignalR connection then join group
        this.chatService.startConnection()
          .then(() => this.joinGroup())
          .catch(err => console.error('SignalR connection failed:', err));
      }
    });

    this.chatService.messages$.subscribe(msgs => {
      this.messages = msgs.map(m => ({
        ...m,
        senderType: (m.senderType ?? '').trim().toLowerCase()
      }));
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  loadSupplier(): void {
    if (this.receiverId && this.senderType === 'Customer') {
      this.http.get<ISupplier>(`${this.apiUrl}/${this.receiverId}`).subscribe(supplier => {
        this.supplier = supplier;
      });
    }
  }

  joinGroup(): void {
    if (this.senderId && this.receiverId) {
      this.chatService.joinGroup(this.senderId, this.receiverId)
        .then(() => console.log('✅ Joined group'))
        .catch(err => console.error('❌ Failed to join group:', err));
    }
  }

  sendMessage(): void {
    const trimmedBody = (this.messageBody || '').trim();
    if (!trimmedBody || !this.senderId || !this.receiverId) {
      alert('❌ Please fill all fields');
      return;
    }

    const sendto = this.senderType === 'Customer' ? 'Supplier' : 'Customer';
    const message: MessageCreateDto = {
      body: `Quantity: ${this.quantity}\n${trimmedBody}`,
      customerId: this.senderType === 'Customer' ? this.senderId : this.receiverId,
      supplierId: this.senderType === 'Supplier' ? this.senderId : this.receiverId,
      senderType: this.senderType,
      Sendto: sendto
    };

    this.chatService.sendMessage(message).subscribe({
      next: () => this.messageBody = '',
      error: err => console.error('❌ Error sending message:', err)
    });
  }

  deleteMessage(id: string): void {
    if (!id || !confirm('Are you sure?')) return;
    this.chatService.deleteMessage(id).subscribe({
      next: () => this.messages = this.messages.filter(m => m.id !== id),
      error: err => console.error('❌ Error deleting message:', err)
    });
  }

  isMyMessage(msg: MessageReadDto): boolean {
    const myId = this.senderId.toLowerCase();
    return (this.senderType === 'Customer' && msg.senderType === 'customer' && msg.customerId?.toLowerCase() === myId) ||
           (this.senderType === 'Supplier' && msg.senderType === 'supplier' && msg.supplierId?.toLowerCase() === myId);
  }

  getSenderType(message: MessageReadDto): 'Customer' | 'Supplier' | 'System' {
    return message.senderType === 'customer'
      ? 'Customer'
      : message.senderType === 'supplier'
        ? 'Supplier'
        : 'System';
  }

  onQuestionClick(question: string): void {
    this.messageBody += (this.messageBody ? '\n' : '') + question;
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    if (this.chatContainer?.nativeElement) {
      this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
    }
  }
}
