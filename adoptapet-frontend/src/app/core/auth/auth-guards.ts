import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Role } from '@core/models/user';
import { Auth } from './auth';
import { AuthStore } from './auth-store';

/** Route data for roleGuard: `data: withRoles('ADMIN', 'WORKER')`. */
export function withRoles(...roles: Role[]): { roles: Role[] } {
  return { roles };
}

/** Requires a session; otherwise goes to login and comes back afterwards. */
export const authGuard: CanActivateFn = (_route, state) => {
  const store = inject(AuthStore);
  return (
    store.isAuthenticated() ||
    inject(Router).createUrlTree(['/login'], { queryParams: { returnUrl: state.url } })
  );
};

/** Requires one of the roles in `data.roles`. Use after authGuard. */
export const roleGuard: CanActivateFn = (route) => {
  const roles = (route.data['roles'] ?? []) as Role[];
  const role = inject(AuthStore).role();
  return (!!role && roles.includes(role)) || inject(Router).createUrlTree(['/forbidden']);
};

/** Login and register are only for visitors; a signed-in user goes to their home. */
export const guestGuard: CanActivateFn = () => {
  const role = inject(AuthStore).role();
  return !role || inject(Router).createUrlTree([inject(Auth).homeFor(role)]);
};
