import { describe, it, expect } from 'vitest';
import { buildHasRole, roleAllowedForRoute } from '../AuthContext';

describe('AuthContext helpers', () => {
  it('roleAllowedForRoute allows admin where staff is allowed', () => {
    expect(roleAllowedForRoute('admin', ['staff', 'admin'])).toBe(true);
    expect(roleAllowedForRoute('user', ['staff', 'admin'])).toBe(false);
  });

  it('buildHasRole reflects staff and admin', () => {
    const staffHas = buildHasRole('staff');
    expect(staffHas('staff')).toBe(true);
    expect(staffHas('admin')).toBe(false);
    const adminHas = buildHasRole('admin');
    expect(adminHas('staff')).toBe(true);
    expect(adminHas('admin')).toBe(true);
  });
});
