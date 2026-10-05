import { Component, computed, inject, input } from '@angular/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { RouterLink } from '@angular/router';
import { Auth } from '@core/auth/auth';
import { AuthStore } from '@core/auth/auth-store';
import { ROLE_LABEL } from '@core/i18n/labels';
import { initialsOf } from '@shared/utils/initials';

/**
 * Avatar + name + chevron of the top bars, with the account menu (profile, sign out).
 * `show="role"` displays the role instead of the first name (staff panel).
 */
@Component({
  selector: 'app-user-menu',
  imports: [MatDividerModule, MatIconModule, MatMenuModule, RouterLink],
  templateUrl: './user-menu.html',
  styleUrl: './user-menu.scss',
})
export class UserMenu {
  private readonly auth = inject(Auth);
  private readonly store = inject(AuthStore);

  readonly show = input<'name' | 'role'>('name');

  protected readonly user = this.store.user;
  protected readonly roleLabel = ROLE_LABEL;
  protected readonly initials = computed(() => initialsOf(this.user() ?? {}));
  protected readonly profilePath = computed(() =>
    this.store.isStaff() ? '/staff/profile' : '/profile',
  );
  protected readonly label = computed(() => {
    const user = this.user();
    if (!user) return '';
    return this.show() === 'role' ? ROLE_LABEL[user.role] : user.firstName;
  });

  protected logout(): void {
    this.auth.logout();
  }
}
