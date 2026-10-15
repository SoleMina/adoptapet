import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { AdopterApi } from '@core/api/adopter-api';
import { Avatar } from '@shared/components/avatar/avatar';
import { EmptyState } from '@shared/components/empty-state/empty-state';
import { ErrorState } from '@shared/components/error-state/error-state';
import { LoadingState } from '@shared/components/loading-state/loading-state';
import { PanelHeader } from '@shared/components/panel-header/panel-header';
import { valueOf } from '@shared/utils/resource';

/** Staff: adopters with their contact data and how many applications each one has. */
@Component({
  selector: 'app-adopter-list',
  imports: [MatIconModule, RouterLink, PanelHeader, Avatar, EmptyState, ErrorState, LoadingState],
  templateUrl: './adopter-list.html',
  styleUrl: './adopter-list.scss',
})
export class AdopterList {
  private readonly adopterApi = inject(AdopterApi);

  protected readonly search = signal('');
  protected readonly adopters = rxResource({ stream: () => this.adopterApi.list() });

  protected readonly rows = computed(() => {
    const term = normalize(this.search());
    return (valueOf(this.adopters) ?? [])
      .filter(
        (adopter) =>
          !term ||
          normalize(
            `${adopter.firstName} ${adopter.lastName} ${adopter.dni} ${adopter.username}`,
          ).includes(term),
      )
      .sort((a, b) =>
        `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`, 'es'),
      );
  });
}

/** Case and accent insensitive. */
function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}
