import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

/** Short messages at the bottom of the screen. */
@Injectable({ providedIn: 'root' })
export class Notify {
  private readonly snackBar = inject(MatSnackBar);

  success(message: string): void {
    this.snackBar.open(message, 'Cerrar', { panelClass: 'ap-snack--success' });
  }

  error(message: string): void {
    this.snackBar.open(message, 'Cerrar', { panelClass: 'ap-snack--error', duration: 7000 });
  }

  info(message: string): void {
    this.snackBar.open(message, 'Cerrar');
  }
}
