import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Auth } from '../../services/auth';
import { SellerMessageService } from '../../services/seller-message.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-seller-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './seller-sidebar.html',
  styleUrl: './seller-sidebar.css'
})
export class SellerSidebarComponent implements OnInit, OnDestroy {
  unreadMessageCount: number = 0;
  private subscription = new Subscription();

  constructor(
    private auth: Auth, 
    private router: Router,
    private sellerMessageService: SellerMessageService
  ) {}

  ngOnInit(): void {
    this.loadUnreadMessageCount();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private loadUnreadMessageCount(): void {
    const currentSupplierId = this.auth.getCurrentUser()?.UserId;
    if (currentSupplierId) {
      this.subscription.add(
        this.sellerMessageService.getCustomerConversations(currentSupplierId)
          .subscribe({
            next: (conversations) => {
              this.unreadMessageCount = conversations.reduce((total, conversation) => 
                total + conversation.unreadCount, 0
              );
            },
            error: (error) => {
              console.error('Error loading unread message count:', error);
            }
          })
      );
    }
  }

  logout(): void {
    this.auth.logout();
    // Hard refresh to ensure clean state
    location.href = '/products';
  }
}