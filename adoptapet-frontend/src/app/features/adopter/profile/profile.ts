import { Component, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ErrorState } from '@shared/components/error-state/error-state';
import { PageHero } from '@shared/components/page-hero/page-hero';
import { ProfileEditor } from '@shared/profile/profile-editor';
import { ProfileFields } from '@shared/profile/profile-fields';

/** "Mi perfil" of the adopter. The logic is in ProfileEditor, shared with the staff page. */
@Component({
  selector: 'app-profile',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    PageHero,
    ProfileFields,
    ErrorState,
  ],
  providers: [ProfileEditor],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile {
  protected readonly editor = inject(ProfileEditor);
}
