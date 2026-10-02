import { decodeJwt, expiresAt } from './jwt';

function token(payload: object): string {
  const encode = (value: object) => btoa(JSON.stringify(value)).replace(/=+$/, '');
  return `${encode({ alg: 'HS512' })}.${encode(payload)}.signature`;
}

describe('jwt', () => {
  it('reads the claims signed by user-service', () => {
    expect(decodeJwt(token({ sub: 'ana', id: 7, role: 'ADOPTER' }))).toEqual({
      sub: 'ana',
      id: 7,
      role: 'ADOPTER',
    });
    expect(decodeJwt('not-a-token')).toBeNull();
  });

  it('prefers the exp claim and falls back to expiresIn', () => {
    expect(expiresAt(token({ exp: 2_000_000_000 }), 3_600_000)).toBe(2_000_000_000_000);
    expect(expiresAt(token({}), 3_600_000, 1_000)).toBe(3_601_000);
  });
});
