import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { User } from 'firebase/auth';
import { EntryProvider } from '../store/entryStore';
import { ChaosController } from '../components/admin/ChaosController';
import { useAppOrchestration } from '../hooks/useAppOrchestration';

const { mockInitRemoteConfig } = vi.hoisted(() => ({
  mockInitRemoteConfig: vi.fn().mockResolvedValue('OPEN'),
}));

vi.mock('../lib/firestore', () => ({
  syncGatePressure: vi.fn(() => vi.fn()),
}));

vi.mock('../lib/firebase', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/firebase')>();
  return {
    ...actual,
    initRemoteConfig: mockInitRemoteConfig,
  };
});

vi.mock('firebase/firestore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('firebase/firestore')>();
  return {
    ...actual,
    onSnapshot: vi.fn((_ref, cb) => {
      queueMicrotask(() => {
        cb({ exists: () => false, data: () => undefined } as never);
      });
      return vi.fn();
    }),
  };
});

function FullFlowHarness({ user }: { user: User | null }) {
  useAppOrchestration(user);
  return <ChaosController />;
}

describe('integration: orchestration + chaos evac drill', () => {
  const mockUser = { uid: 'integration-user-1', isAnonymous: false } as User;
  let speakSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mockInitRemoteConfig.mockClear();
    speakSpy = vi.spyOn(window.speechSynthesis, 'speak').mockImplementation(() => {});
  });

  afterEach(() => {
    speakSpy.mockRestore();
  });

  it('sign-in → remote config → chaos evac calls speech with evacuation copy', async () => {
    render(
      <EntryProvider>
        <FullFlowHarness user={mockUser} />
      </EntryProvider>
    );

    await waitFor(() => {
      expect(mockInitRemoteConfig).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByRole('button', { name: /emergency evacuation drill/i }));

    await waitFor(() => {
      expect(speakSpy).toHaveBeenCalled();
    });

    const utterance = speakSpy.mock.calls[0][0] as SpeechSynthesisUtterance;
    expect(utterance.text).toMatch(/exit|Emergency|nearest/i);
  });
});
