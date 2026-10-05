import { Resource } from '@angular/core';

/**
 * Value of a resource, or `undefined` while it loads or after it failed.
 * Reading `resource.value()` directly throws when the resource is in error state, which would break
 * every `computed` that depends on it; the template shows the error with `resource.error()` instead.
 */
export function valueOf<T>(resource: Resource<T>): T | undefined {
  return resource.hasValue() ? resource.value() : undefined;
}
