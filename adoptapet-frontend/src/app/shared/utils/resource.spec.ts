import { resource } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { valueOf } from './resource';

describe('valueOf', () => {
  it('returns the value once loaded', async () => {
    const loaded = TestBed.runInInjectionContext(() => resource({ loader: async () => 'ok' }));
    expect(valueOf(loaded)).toBeUndefined();
    await new Promise((resolve) => setTimeout(resolve));
    expect(valueOf(loaded)).toBe('ok');
  });

  it('returns undefined instead of throwing when the resource failed', async () => {
    const failed = TestBed.runInInjectionContext(() =>
      resource<string, unknown>({
        loader: async () => {
          throw new Error('boom');
        },
      }),
    );
    await new Promise((resolve) => setTimeout(resolve));
    expect(failed.error()).toBeTruthy();
    expect(() => failed.value()).toThrow();
    expect(valueOf(failed)).toBeUndefined();
  });
});
