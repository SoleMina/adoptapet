import { Component, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ErrorState } from '@shared/components/error-state/error-state';
import { PanelHeader } from '@shared/components/panel-header/panel-header';
import { ProfileEditor } from '@shared/profile/profile-editor';
import { ProfileFields } from '@shared/profile/profile-fields';

/** "Mi perfil" of the staff (WORKER and ADMIN). The logic is in ProfileEditor, shared with the adopter page. */
@Component({
  selector: 'app-staff-profile',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    PanelHeader,
    ProfileFields,
    ErrorState,
  ],
  providers: [ProfileEditor],
  templateUrl: './staff-profile.html',
  styleUrl: './staff-profile.scss',
})
export class StaffProfile {
  protected readonly editor = inject(ProfileEditor);
}
