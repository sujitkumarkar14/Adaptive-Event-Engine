import { describe, it, expect } from 'vitest';
import { isRoutingMockEnabled } from '../routingEnv';

describe('routingEnv', () => {
  it('reflects VITE_USE_ROUTING_MOCK (true in unit env by default)', () => {
    expect(isRoutingMockEnabled()).toBe(true);
  });
});
