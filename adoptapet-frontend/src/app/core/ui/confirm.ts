import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmData, ConfirmDialog } from '@shared/components/confirm-dialog/confirm-dialog';
import { Observable, filter, map } from 'rxjs';

/** Asks before an action that changes the state of a record. */
@Injectable({ providedIn: 'root' })
export class Confirm {
  private readonly dialog = inject(MatDialog);

  /** Emits once, and only when the user confirms. */
  ask(data: ConfirmData): Observable<void> {
    return this.dialog
      .open<ConfirmDialog, ConfirmData, boolean>(ConfirmDialog, { data })
      .afterClosed()
      .pipe(
        filter((confirmed) => confirmed === true),
        map(() => undefined),
      );
  }
}
