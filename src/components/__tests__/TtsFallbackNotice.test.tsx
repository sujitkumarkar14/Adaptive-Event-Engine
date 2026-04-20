import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TtsFallbackNotice } from '../TtsFallbackNotice';

vi.mock('../../hooks/useTranslation', () => ({
  useTranslation: () => ({
    ttsSupported: false,
    t: (_k: string, d: string) => d,
    announceEmergency: vi.fn(),
    locale: 'en',
  }),
}));

describe('TtsFallbackNotice', () => {
  it('renders status when TTS is unavailable', () => {
    render(<TtsFallbackNotice />);
    expect(screen.getByRole('status')).toHaveTextContent(/Audio alerts are unavailable/);
  });
});
