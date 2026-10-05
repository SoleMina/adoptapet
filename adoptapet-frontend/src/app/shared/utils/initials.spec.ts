import { initialsOf } from './initials';

describe('initialsOf', () => {
  it('takes the first letter of the first and last name', () => {
    expect(initialsOf({ firstName: 'Ana', lastName: 'Torres' })).toBe('AT');
    expect(initialsOf({ firstName: ' carla ', lastName: 'rojas' })).toBe('CR');
  });

  it('works with missing data', () => {
    expect(initialsOf({ firstName: 'Admin', lastName: null })).toBe('A');
    expect(initialsOf({})).toBe('');
  });
});
