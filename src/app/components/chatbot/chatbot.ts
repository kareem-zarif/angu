import { Component } from '@angular/core';
import { ChatbotService } from '../../services/chatbot-service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-chatbot',
  imports: [ FormsModule,CommonModule],
  templateUrl: './chatbot.html',
  styleUrl: './chatbot.css'
})
export class Chatbot {
   // الأسئلة الثابتة
  presetQuestions: string[] = [
    'ما هي مواعيد العمل؟',
    'كيف يمكنني تتبع طلبي؟',
    'هل يوجد شحن دولي؟',
    'ما هي سياسة الاسترجاع؟'
  ];

  // النص اللي في التكست بوكس
  question: string = '';
  answer: string = '';
  loading: boolean = false;

  constructor(private chatService: ChatbotService) {}

  // لما يختار سؤال من القائمة
  selectQuestion(q: string) {
    this.question = q; // ✅ هنشتغل على نفس المتغير
  }

  sendQuestion() {
    if (!this.question.trim()) return;

    this.loading = true;
    this.answer = '';

    this.chatService.askQuestion(this.question).subscribe({
      next: (res) => {
        this.answer = res.answer;
        this.loading = false;
      },
      error: (err) => {
        console.error('❌ Error:', err);
        this.loading = false;
      }
    });
  }
}

