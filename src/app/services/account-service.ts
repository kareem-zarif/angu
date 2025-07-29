import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root' //Correct singleton pattern for shared services
})
export class AccountService {
  // Placeholder for future account management logic
  getAccountInfo() {
    // This would fetch account info from backend in a real app
    return { name: 'User', email: 'user@email.com' };
  }
}
