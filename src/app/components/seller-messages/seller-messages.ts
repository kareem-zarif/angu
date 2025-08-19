import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { SellerMessageService, CustomerConversation } from '../../services/seller-message.service';
import { MessageReadDto, MessageCreateDto } from '../../models/i-message';
import { Auth } from '../../services/auth';
import { SignalrService } from '../../services/signalr-service';

@Component({
  selector: 'app-seller-messages',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './seller-messages.html',
  styleUrl: './seller-messages.css'
})
export class SellerMessagesComponent implements OnInit, OnDestroy {
  conversations: CustomerConversation[] = [];
  selectedConversation: CustomerConversation | null = null;
  messages: MessageReadDto[] = [];
  newMessage: string = '';
  
  isLoading = false;
  hasError = false;
  errorMessage = '';
  
  currentSupplierId: string = '';
  
  private subscription = new Subscription();

  constructor(
    private sellerMessageService: SellerMessageService,
    private auth: Auth,
    private signalrService: SignalrService
  ) {}

  ngOnInit(): void {
    this.currentSupplierId = this.auth.getCurrentUser()?.UserId || '';
    
    if (!this.currentSupplierId) {
      this.hasError = true;
      this.errorMessage = 'Supplier ID not found. Please log in again.';
      return;
    }

    this.loadConversations();
    this.setupSignalR();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private setupSignalR(): void {
    // Start SignalR connection
    this.signalrService.startConnection()
      .then(() => {
        console.log('SignalR connected for seller messages');
        
        // Subscribe to new messages
        this.subscription.add(
          this.signalrService.messages$.subscribe(newMessages => {
            // Refresh conversations when new messages arrive
            this.loadConversations();
          })
        );
      })
      .catch(error => {
        console.error('Failed to connect to SignalR:', error);
      });
  }

  loadConversations(): void {
    this.isLoading = true;
    this.hasError = false;

    this.subscription.add(
      this.sellerMessageService.getCustomerConversations(this.currentSupplierId)
        .subscribe({
          next: (conversations) => {
            this.conversations = conversations;
            this.isLoading = false;
            
            // Update messages if a conversation is selected
            if (this.selectedConversation) {
              const updatedConversation = conversations.find(c => c.customerId === this.selectedConversation?.customerId);
              if (updatedConversation) {
                this.messages = updatedConversation.messages;
              }
            }
          },
          error: (error) => {
            console.error('Error loading conversations:', error);
            this.hasError = true;
            this.errorMessage = 'Failed to load conversations. Please try again.';
            this.isLoading = false;
          }
        })
    );
  }

  selectConversation(conversation: CustomerConversation): void {
    this.selectedConversation = conversation;
    this.messages = conversation.messages;
    this.newMessage = '';
    
    // Join the SignalR group for this conversation
    if (this.signalrService.hubConnection && this.signalrService.hubConnection.state === 'Connected') {
      this.signalrService.joinGroup(conversation.customerId, this.currentSupplierId)
        .then(() => console.log('Joined conversation group'))
        .catch(error => console.error('Failed to join group:', error));
    }
  }

  sendMessage(): void {
    if (!this.newMessage.trim() || !this.selectedConversation) {
      return;
    }

    const messageData: MessageCreateDto = {
      body: this.newMessage.trim(),
      customerId: this.selectedConversation.customerId,
      supplierId: this.currentSupplierId,
      senderType: 'Supplier',
      Sendto: 'Customer'
    };

    this.subscription.add(
      this.sellerMessageService.createMessage(messageData)
        .subscribe({
          next: (newMessage) => {
            this.newMessage = '';
            // Refresh conversations to show the new message
            this.loadConversations();
            console.log('Message sent successfully:', newMessage);
          },
          error: (error) => {
            console.error('Error sending message:', error);
            // You could show a toast notification here
          }
        })
    );
  }

  deleteMessage(messageId: string): void {
    this.subscription.add(
      this.sellerMessageService.deleteMessage(messageId)
        .subscribe({
          next: () => {
            // Remove the message from the local list
            this.messages = this.messages.filter(m => m.id !== messageId);
            console.log('Message deleted successfully');
          },
          error: (error) => {
            console.error('Error deleting message:', error);
          }
        })
    );
  }

  formatTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  }

  isMyMessage(message: MessageReadDto): boolean {
    return message.senderType.toLowerCase() === 'supplier';
  }

  getUnreadCount(conversation: CustomerConversation): number {
    return conversation.unreadCount;
  }

  refreshConversations(): void {
    this.loadConversations();
  }
}
