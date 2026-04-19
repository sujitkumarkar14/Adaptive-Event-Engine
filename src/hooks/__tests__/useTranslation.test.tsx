import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useTranslation } from '../useTranslation';

describe('useTranslation', () => {
  it('t returns fallback text', () => {
    const { result } = renderHook(() => useTranslation());
    expect(result.current.t('any.key', 'Fallback copy')).toBe('Fallback copy');
  });

  it('announceEmergency calls speechSynthesis.speak when available', () => {
    const speak = vi.fn();
    const orig = window.speechSynthesis;
    Object.defineProperty(window, 'speechSynthesis', {
      value: { speak },
      configurable: true,
    });
    const { result } = renderHook(() => useTranslation());
    result.current.announceEmergency('Evacuate now');
    expect(speak).toHaveBeenCalled();
    Object.defineProperty(window, 'speechSynthesis', { value: orig, configurable: true });
  });

  it('announceEmergency skips speak when speechSynthesis is absent', () => {
    const orig = window.speechSynthesis;
    delete (window as unknown as { speechSynthesis?: SpeechSynthesis }).speechSynthesis;
    const { result } = renderHook(() => useTranslation());
    expect(() => result.current.announceEmergency('x')).not.toThrow();
    Object.defineProperty(window, 'speechSynthesis', {
      value: orig,
      configurable: true,
      writable: true,
    });
  });
});
