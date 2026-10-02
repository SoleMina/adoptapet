import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Theme } from '@core/ui/theme';

@Component({
  selector: 'app-theme-toggle',
  imports: [MatButtonModule, MatIconModule, MatTooltipModule],
  template: `
    <button
      matIconButton
      type="button"
      [attr.aria-label]="label()"
      [matTooltip]="label()"
      (click)="theme.toggle()"
    >
      <mat-icon aria-hidden="true">{{
        theme.mode() === 'dark' ? 'light_mode' : 'dark_mode'
      }}</mat-icon>
    </button>
  `,
})
export class ThemeToggle {
  protected readonly theme = inject(Theme);
  protected readonly label = computed(() =>
    this.theme.mode() === 'dark' ? 'Usar modo claro' : 'Usar modo oscuro',
  );
}
