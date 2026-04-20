import { describe, it, expect } from 'vitest';
import { buildHasRole, roleAllowedForRoute } from '../AuthContext';

describe('roleAllowedForRoute', () => {
  it('allows exact role matches', () => {
    expect(roleAllowedForRoute('user', ['user', 'staff'])).toBe(true);
    expect(roleAllowedForRoute('staff', ['staff', 'admin'])).toBe(true);
    expect(roleAllowedForRoute('admin', ['admin'])).toBe(true);
  });

  it('lets admin access staff-only route groups', () => {
    expect(roleAllowedForRoute('admin', ['staff', 'admin'])).toBe(true);
  });

  it('blocks user from staff-only routes', () => {
    expect(roleAllowedForRoute('user', ['staff', 'admin'])).toBe(false);
  });

  it('blocks staff from admin-only lists when admin not included', () => {
    expect(roleAllowedForRoute('staff', ['admin'])).toBe(false);
  });
});

describe('buildHasRole', () => {
  it('treats "user" as satisfied by all roles', () => {
    expect(buildHasRole('user')('user')).toBe(true);
    expect(buildHasRole('staff')('user')).toBe(true);
    expect(buildHasRole('admin')('user')).toBe(true);
  });

  it('requires staff or admin for "staff"', () => {
    expect(buildHasRole('user')('staff')).toBe(false);
    expect(buildHasRole('staff')('staff')).toBe(true);
    expect(buildHasRole('admin')('staff')).toBe(true);
  });

  it('requires admin for "admin"', () => {
    expect(buildHasRole('staff')('admin')).toBe(false);
    expect(buildHasRole('admin')('admin')).toBe(true);
  });

  it('returns false for unknown required role strings', () => {
    expect(buildHasRole('admin')('superuser')).toBe(false);
  });
});
