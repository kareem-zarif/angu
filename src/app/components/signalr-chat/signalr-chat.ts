import { Component, OnInit } from '@angular/core';
import {SignalrService } from '../../services/signalr-service';
import { MessageCreateDto, MessageReadDto } from '../../models/i-message';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-signalr-chat',
  imports: [FormsModule,CommonModule],
  templateUrl: './signalr-chat.html',
  styleUrl: './signalr-chat.css'
})
export class SignalrChat implements OnInit {
    senderType: 'Customer' | 'Supplier' = 'Customer';
  senderId: string = '';
  receiverId: string = '';
  messageBody: string = '';
  messages: MessageReadDto[] = [];

  constructor(private chatService: SignalrService) {}

ngOnInit(): void {
  this.chatService.startConnection();

  this.chatService.messages$.subscribe(msgs => {
      console.log('📩 All messages from API:', msgs); 
    // هنا إحنا بناخد الرسائل زي ما الـ API بيبعتها
    this.messages = msgs.map(m => ({
      ...m,
     senderType: (m.senderType ?? '').trim().toLowerCase()// جاي من الـ API
    }));
  });
}

  joinGroup(): void {
    const customerId = this.senderType === 'Customer' ? this.senderId : this.receiverId;
    const supplierId = this.senderType === 'Supplier' ? this.senderId : this.receiverId;

    if (!customerId || !supplierId) {
      alert('❌ Please fill both IDs');
      return;
    }

    this.chatService.joinGroup(customerId, supplierId)
      .then(() => console.log('✅ Joined group'))
      .catch(err => console.error('❌ Failed to join group:', err));
  }

sendMessage(): void {
  if (!this.messageBody.trim() || !this.senderId || !this.receiverId) {
    alert('❌ Please fill all fields');
    return;
  }

  const customerId = this.senderType === 'Customer' ? this.senderId : this.receiverId;
  const supplierId = this.senderType === 'Supplier' ? this.senderId : this.receiverId;
  const sendto = this.senderType === 'Customer' ? 'Supplier' : 'Customer';

  const message: MessageCreateDto = {
    body: this.messageBody,
    customerId,
    supplierId,
    senderType: this.senderType,
    Sendto: sendto
   
  };
  console.log("🚀 Sending message:", message);
    this.chatService.sendMessage(message).subscribe({
    next: () => {
      // نضيف الرسالة اللي جاية من الباك وفيها الـ senderType الحقيقي

      this.messageBody = '';
    },
    error: err => console.error('❌ Error sending message:', err)
  });

}

deleteMessage(id: string): void {
  if (!id) {
    console.warn('⚠️ لا يمكن حذف رسالة بدون ID.');
    return;
  }

  if (!confirm('Are you sure you want to delete this message?')) return;

  this.chatService.deleteMessage(id).subscribe({
    next: () => {
      console.log('✅ Message deleted');
      this.messages = this.messages.filter(m => m.id !== id); // تحديث الـ UI
    },
    error: err => console.error('❌ Error deleting message:', err)
  });
}

isMyMessage(msg: MessageReadDto): boolean {
  if (!this.senderId) return false;

  const myId = this.senderId.toLowerCase();
  const senderType = this.senderType.toLowerCase();

  if (senderType === 'customer') {
    return msg.senderType === 'customer' &&
           (msg.customerId ?? '').toLowerCase() === myId;
  }

  if (senderType === 'supplier') {
    return msg.senderType === 'supplier' &&
           (msg.supplierId ?? '').toLowerCase() === myId;
  }

  return false;
}



getSenderType(message: MessageReadDto): 'Customer' | 'Supplier' | 'System' {
  switch (message.senderType) {
    case 'customer': return 'Customer';
    case 'supplier': return 'Supplier';
    default: return 'System';
  }
}







}
