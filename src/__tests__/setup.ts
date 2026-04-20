import '@testing-library/jest-dom';
import * as axeMatchers from 'vitest-axe/matchers';
import { expect, vi } from 'vitest';

expect.extend(axeMatchers);

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

// jsdom: silence "Not implemented: HTMLCanvasElement.getContext" from dependencies (e.g. maps).
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = vi.fn(() => null);
}
