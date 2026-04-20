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

  it('returns empty-query copy', () => {
    expect(buildConciergeAssistanceReply('')).toMatch(/Ask a short question/i);
    expect(buildConciergeAssistanceReply('   ')).toMatch(/Ask a short question/i);
  });

  it('returns accessibility copy for step-free and elevator wording', () => {
    const r = buildConciergeAssistanceReply('wheelchair access to elevator');
    expect(r).toMatch(/step-free|accessibility|onboarding/i);
  });

  it('returns wayfinding copy for gate and map queries', () => {
    expect(buildConciergeAssistanceReply('where is the gate')).toMatch(/Dashboard/i);
    expect(buildConciergeAssistanceReply('how do i walk to section')).toMatch(/walking route|Dashboard/i);
  });

  it('returns amenities copy for restroom and food', () => {
    expect(buildConciergeAssistanceReply('nearest restroom')).toMatch(/Concourse Copilot|Dashboard/i);
    expect(buildConciergeAssistanceReply('food on concourse')).toMatch(/Concourse|Dashboard/i);
  });

  it('returns booking copy for slots and arrival', () => {
    const r = buildConciergeAssistanceReply('book an arrival slot');
    expect(r).toMatch(/Arrival Booking|booking/i);
  });
});

