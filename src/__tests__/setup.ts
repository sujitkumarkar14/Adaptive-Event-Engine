import '@testing-library/jest-dom';
import { vi } from 'vitest';

// jsdom does not ship Web Speech API — stubs for useTranslation tests and components.
if (typeof globalThis.SpeechSynthesisUtterance === 'undefined') {
  globalThis.SpeechSynthesisUtterance = class SpeechSynthesisUtterancePolyfill {
    lang = '';
    pitch = 1;
    rate = 1;
    constructor(public text: string) {}
  } as unknown as typeof SpeechSynthesisUtterance;
}

if (!window.speechSynthesis) {
  Object.defineProperty(window, 'speechSynthesis', {
    value: { speak: vi.fn() },
    configurable: true,
    writable: true,
  });
}
