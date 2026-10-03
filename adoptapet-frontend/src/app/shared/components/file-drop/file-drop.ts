import { Component, computed, input, model, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

/** Same rule as the backend: PDF, JPG or PNG. */
const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const ACCEPT = '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png';

/**
 * Drop zone for one document: drag & drop or "Seleccionar archivo". Validates type and size before the
 * file reaches the form. Two-way binding: `[(file)]="dniFile"`.
 */
@Component({
  selector: 'app-file-drop',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './file-drop.html',
  styleUrl: './file-drop.scss',
  host: {
    '[class.dragging]': 'dragging()',
    '[class.has-file]': '!!file()',
    '[class.invalid]': '!!message()',
  },
})
export class FileDrop {
  readonly label = input.required<string>();
  readonly inputId = input.required<string>();
  readonly maxMb = input(5);
  /** Shown when the user tries to continue without a file. */
  readonly required = input(false);
  readonly showRequiredError = input(false);

  readonly file = model<File | null>(null);

  protected readonly accept = ACCEPT;
  protected readonly dragging = signal(false);
  protected readonly rejected = signal<string | null>(null);

  protected readonly message = computed(() => {
    if (this.rejected()) return this.rejected();
    return this.required() && this.showRequiredError() && !this.file()
      ? 'Adjunta este documento para continuar'
      : null;
  });

  protected readonly size = computed(() => {
    const bytes = this.file()?.size ?? 0;
    return bytes < 1024 * 1024
      ? `${Math.max(1, Math.round(bytes / 1024))} KB`
      : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  });

  protected onPicked(input: HTMLInputElement): void {
    this.take(input.files?.[0]);
    input.value = '';
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    this.take(event.dataTransfer?.files[0]);
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(true);
  }

  protected remove(): void {
    this.file.set(null);
    this.rejected.set(null);
  }

  private take(file: File | undefined): void {
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      this.rejected.set('Solo se permiten archivos PDF, JPG o PNG');
      return;
    }
    if (file.size > this.maxMb() * 1024 * 1024) {
      this.rejected.set(`El archivo supera los ${this.maxMb()} MB`);
      return;
    }
    this.rejected.set(null);
    this.file.set(file);
  }
}
