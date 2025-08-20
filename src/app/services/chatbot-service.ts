import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatbotService {
    private apiUrl = 'https://localhost:7253/api/ChatGPT/ask'; // API بتاعك

  constructor(private http: HttpClient) {}

  askQuestion(question: string): Observable<any> {
    return this.http.post(this.apiUrl, { question });
  }
}
