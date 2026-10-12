import { Component, computed, input } from '@angular/core';
import { initialsOf } from '@shared/utils/initials';

/** Circle with the initials of a person ("AT"). Decorative: the name is always next to it. */
@Component({
  selector: 'app-avatar',
  host: { 'aria-hidden': 'true', '[attr.data-size]': 'size()' },
  template: `{{ initials() }}`,
  styles: `
    :host {
      display: inline-grid;
      flex-shrink: 0;
      place-items: center;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background-color: var(--ap-color-primary-soft);
      color: var(--ap-color-primary);
      font-size: var(--ap-font-size-md);
      font-weight: 800;
    }

    :host([data-size='large']) {
      width: 96px;
      height: 96px;
      font-size: var(--ap-font-size-2xl);
    }
  `,
})
export class Avatar {
  readonly person = input.required<{ firstName?: string | null; lastName?: string | null }>();
  readonly size = input<'medium' | 'large'>('medium');

  protected readonly initials = computed(() => initialsOf(this.person()));
}
