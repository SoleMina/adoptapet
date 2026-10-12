import { Component, DestroyRef, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';

export interface DocumentViewerData {
  title: string;
  /** The protected file, already downloaded with the user's token. */
  blob: Blob;
  fileName: string;
}

/**
 * Shows a PDF or an image inside the page. Protected files cannot be opened with a plain link (they need
 * the JWT) and a new tab opened after a request can be blocked as a pop-up, so they are previewed here.
 */
@Component({
  selector: 'app-document-viewer',
  imports: [MatButtonModule, MatDialogModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content class="content">
      @if (isImage) {
        <img [src]="url" [alt]="data.title" />
      } @else {
        <iframe [src]="url" [title]="data.title"></iframe>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <a matButton="tonal" [href]="url" [download]="data.fileName">
        <mat-icon aria-hidden="true">download</mat-icon>
        Descargar
      </a>
      <button matButton="filled" type="button" mat-dialog-close cdkFocusInitial>Cerrar</button>
    </mat-dialog-actions>
  `,
  styles: `
    .content {
      display: grid;
      place-items: center;
      min-height: 60vh;
      padding-block: 0;
      background-color: var(--ap-color-neutral-soft);
    }

    iframe {
      width: 100%;
      height: 70vh;
      border: 0;
    }

    img {
      max-width: 100%;
      max-height: 70vh;
      object-fit: contain;
    }
  `,
})
export class DocumentViewer {
  protected readonly data = inject<DocumentViewerData>(MAT_DIALOG_DATA);
  private readonly objectUrl = URL.createObjectURL(this.data.blob);

  protected readonly isImage = this.data.blob.type.startsWith('image/');
  // Safe: the URL points to a blob this page created from our own API response.
  protected readonly url = inject(DomSanitizer).bypassSecurityTrustResourceUrl(this.objectUrl);

  constructor() {
    inject(DestroyRef).onDestroy(() => URL.revokeObjectURL(this.objectUrl));
  }
}
