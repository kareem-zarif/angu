import { Directive, Input, TemplateRef, ViewContainerRef, OnInit } from '@angular/core';
import { Auth } from '../../services/auth';
import { Role } from '../../models/enums/roles';

@Directive({
  selector: '[hasRole]',
  standalone: true
})
export class HasRoleDirective implements OnInit {
  @Input('hasRole') roles!: Role[];
  private isVisible = false;

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private auth: Auth
  ) { }

  ngOnInit() {
    this.updateView();

    // Optional: Subscribe to auth changes
    this.auth.currentUser$.subscribe(() => {
      this.updateView();
    });
  }

  private updateView(): void {
    const hasRole = this.checkRoles();

    if (hasRole && !this.isVisible) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.isVisible = true;
    } else if (!hasRole && this.isVisible) {
      this.viewContainer.clear();
      this.isVisible = false;
    }
  }

  private checkRoles(): boolean {
    const user = this.auth.getCurrentUser();
    if (!user || !user.roles) return false;

    return this.roles.some(role => user.roles.includes(role));
  }
}
