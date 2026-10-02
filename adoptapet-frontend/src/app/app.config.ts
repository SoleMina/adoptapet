import { registerLocaleData } from '@angular/common';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import localeEsPE from '@angular/common/locales/es-PE';
import {
  ApplicationConfig,
  ErrorHandler,
  LOCALE_ID,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
import { MAT_DIALOG_DEFAULT_OPTIONS, MatDialogConfig } from '@angular/material/dialog';
import {
  MAT_FORM_FIELD_DEFAULT_OPTIONS,
  MatFormFieldDefaultOptions,
} from '@angular/material/form-field';
import { MatIconRegistry } from '@angular/material/icon';
import { MAT_SNACK_BAR_DEFAULT_OPTIONS, MatSnackBarConfig } from '@angular/material/snack-bar';
import { DomSanitizer } from '@angular/platform-browser';
import {
  PreloadAllModules,
  TitleStrategy,
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
  withPreloading,
  withViewTransitions,
} from '@angular/router';
import { Auth } from '@core/auth/auth';
import { GlobalErrorHandler } from '@core/errors/global-error-handler';
import { authInterceptor } from '@core/http/auth-interceptor';
import { errorInterceptor } from '@core/http/error-interceptor';
import { loadingInterceptor } from '@core/http/loading-interceptor';
import { PageTitleStrategy } from '@core/routing/page-title-strategy';
import { Theme } from '@core/ui/theme';
import { routes } from './app.routes';

registerLocaleData(localeEsPE);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    { provide: ErrorHandler, useClass: GlobalErrorHandler },

    provideRouter(
      routes,
      withComponentInputBinding(),
      withViewTransitions(),
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' }),
      withPreloading(PreloadAllModules),
    ),
    { provide: TitleStrategy, useExisting: PageTitleStrategy },

    // Order matters: auth adds the token, loading wraps the request, error maps the failure.
    provideHttpClient(
      withFetch(),
      withInterceptors([authInterceptor, loadingInterceptor, errorInterceptor]),
    ),

    { provide: LOCALE_ID, useValue: 'es-PE' },
    { provide: MAT_DATE_LOCALE, useValue: 'es-PE' },
    provideNativeDateAdapter(),
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: {
        appearance: 'outline',
        subscriptSizing: 'dynamic',
      } satisfies MatFormFieldDefaultOptions,
    },
    {
      provide: MAT_SNACK_BAR_DEFAULT_OPTIONS,
      useValue: {
        duration: 4500,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
      } satisfies MatSnackBarConfig,
    },
    {
      provide: MAT_DIALOG_DEFAULT_OPTIONS,
      useValue: {
        width: 'calc(100vw - 32px)',
        maxWidth: '560px',
        autoFocus: 'first-tabbable',
        restoreFocus: true,
      } satisfies MatDialogConfig,
    },

    provideAppInitializer(() => {
      const icons = inject(MatIconRegistry);
      icons.setDefaultFontSetClass('material-symbols-rounded', 'mat-ligature-font');
      icons.addSvgIcon('logo', inject(DomSanitizer).bypassSecurityTrustResourceUrl('logo.svg'));
      // Eager: restore the session timer and the color scheme before the first screen.
      inject(Auth);
      inject(Theme);
    }),
  ],
};
