import { describe, it, expect } from 'vitest';
import { buildConciergeAssistanceReply } from '../conciergeAssistance';

describe('buildConciergeAssistanceReply', () => {
  it('returns emergency guidance for SOS-style queries', () => {
    const r = buildConciergeAssistanceReply('I need SOS help');
    expect(r).toMatch(/SOS/i);
    expect(r).toMatch(/Dashboard/i);
  });

  it('returns generic venue guidance for unknown queries', () => {
    const r = buildConciergeAssistanceReply('hello there');
    expect(r).toMatch(/Dashboard/i);
  });
});
