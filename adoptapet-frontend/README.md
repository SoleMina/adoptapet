# AdoptaPet — frontend

Angular 22 · Angular Material 3 · Material Symbols · Vitest · ESLint + Prettier.

Web client of the AdoptaPet microservices. It only talks to the API Gateway (`http://localhost:8080/api`);
CORS for `http://localhost:4200` is configured there. The UI follows the Figma file "AdoptaPet — Vistas por rol".

## Requirements

* Node **22.22.3+** (or 24.15+). The folder has an `.nvmrc`: run `nvm use`.
* The backend running (see `../adoptapet-backend/README.md`).

## Run

```sh
nvm use
npm install
npm start            # http://localhost:4200
```

| Script | What it does |
|---|---|
| `npm start` | Dev server with reload |
| `npm run build` | Production build in `dist/` (fails on budget errors) |
| `npm test` | Unit tests (Vitest) |
| `npm run lint` | angular-eslint (TypeScript + template accessibility rules) |
| `npm run format` / `format:check` | Prettier |

The API URL lives in `src/environments/environment*.ts` (`apiUrl` and `apiOrigin`, used to build pet image URLs).

## Structure

```
src/
├── app/
│   ├── core/                 # singletons, no UI
│   │   ├── api/              # one service per backend resource (every endpoint of the API is here)
│   │   ├── auth/             # AuthStore (session signals), Auth (login/register/logout/expiry), guards, JWT
│   │   ├── http/             # interceptors: auth (Bearer), loading (progress bar), error (ProblemDetail → ApiError)
│   │   ├── errors/           # ApiError, Spanish messages for backend errors, form server errors, ErrorHandler
│   │   ├── i18n/labels.ts    # Spanish labels and tones for every enum (gender agreement: "Sana" / "Sano")
│   │   ├── models/           # TypeScript interfaces identical to the backend DTOs
│   │   ├── routing/          # "<page> · AdoptaPet" title strategy
│   │   ├── storage/          # safe localStorage access
│   │   ├── ui/               # Notify (snackbar), Loading, Theme (light/dark)
│   │   └── utils/            # multipart FormData, protected file download
│   ├── shared/               # reusable UI: page-header, pet-card, pet-photo, field-error, empty/error states,
│   │                         # skeletons, coming-soon; pipes (petAge, limaDate); validators
│   ├── layouts/
│   │   ├── site-layout/      # visitor + adopter: top bar of the Figma, mobile menu
│   │   └── staff-layout/     # WORKER + ADMIN: side menu (drawer on mobile), menu items by role
│   ├── features/             # pages, lazy loaded by area
│   │   ├── public/           # home, pet-catalog, pet-detail
│   │   ├── auth/             # login, register (2 steps)
│   │   ├── adopter/          # routes only for now (coming soon)
│   │   ├── staff/            # routes only for now (coming soon), admin-only routes inside
│   │   └── errors/           # 403 / 404
│   ├── app.config.ts         # router, HTTP + interceptors, locale es-PE, Material defaults, icons
│   └── app.routes.ts
├── environments/
└── styles/                   # global styles (see Theme)
```

## Routes

| Route | Who | Status |
|---|---|---|
| `/`, `/pets`, `/pets/:id` | everyone | ✅ built |
| `/login`, `/register` | visitors only (`guestGuard`) | ✅ built |
| `/my-applications`, `/my-applications/:id`, `/apply/:petId`, `/notifications`, `/profile` | ADOPTER | placeholder |
| `/staff/dashboard`, `applications`, `applications/:id`, `pets`, `delivery-calendar`, `adopters`, `adopters/:id`, `profile` | ADMIN, WORKER | placeholder |
| `/staff/workers`, `/staff/users`, `/staff/reports` | ADMIN | placeholder |
| `/forbidden`, `**` | everyone | ✅ built |

After login an adopter goes to `returnUrl` or the catalog, staff to `/staff/dashboard` (as in the Figma). The session
is stored in `localStorage` and closed automatically when the JWT expires (there is no refresh token).

## Theme

All design values come from the Figma and live in **`src/styles/_tokens.scss`** as CSS custom properties, each one with
its light and dark value (`light-dark()`). Angular Material reads the same tokens (`_theme.scss`), so changing a color
there changes the whole app.

| File | Content |
|---|---|
| `_tokens.scss` | colors, status colors, font sizes, radii, spacing, shadows, layout sizes |
| `_theme-colors.scss` | M3 palettes generated with `ng generate @angular/material:theme-color` from `#541DCE` |
| `_theme.scss` | Material theme + overrides (buttons, progress bar) |
| `_breakpoints.scss` | `bp.up(bp.$md)` mixin for component styles (no CSS output) |
| `_base.scss`, `_forms.scss`, `_utilities.scss` | reset, form fields of the design, shared blocks (`.ap-card`, `.ap-banner`, `.ap-tone`) |

Light mode is the default (the design). The sun/moon button switches to dark and remembers the choice.

## Conventions

* Standalone components, signals, `inject()`, `input()`/`output()`, new control flow, typed reactive forms.
  Angular 22 is zoneless and `OnPush` by default, so components do not declare it.
* File names follow the Angular 20+ style guide (`pet-card.ts`, `auth-guards.ts`, `pet-age-pipe.ts`).
* Components never use `HttpClient`: they call `core/api` services and read with `rxResource`.
* Code in English, UI text in Spanish (Peru). Dates with the `limaDate` pipe (`America/Lima`, UTC-5).
* Form fields use the design's own inputs (`.ap-field` / `.ap-input`, label above). Material is used for buttons,
  icons, menus, side nav, snackbar and progress bar.
* Errors: the interceptor handles 401 (logout), 403, connection and 5xx; each screen shows 400/404/409 next to the
  form. Validation errors from the backend are put on the matching field.
