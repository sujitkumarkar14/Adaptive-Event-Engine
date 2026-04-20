import React, { useEffect } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { EntryProvider, useEntryStore } from '../../../store/entryStore';
import { ConcourseCopilotCard } from '../ConcourseCopilotCard';

const mockFetchTip = vi.hoisted(() =>
  vi.fn().mockResolvedValue({
    tip: 'Smart tip: Restroom 109 is a 3-minute walk and currently empty.',
    places: [{ name: 'Restroom 109' }],
  })
);

vi.mock('../../../lib/maps', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../lib/maps')>();
  return {
    ...actual,
    fetchConcourseCopilotTip: mockFetchTip,
  };
});

vi.mock('../../../services/translationClient', () => ({
  translateAlertText: vi.fn((t: string) => Promise.resolve(t)),
}));

function CopilotWithStepFree() {
  const { dispatch } = useEntryStore();
  useEffect(() => {
    dispatch({ type: 'TOGGLE_ACCESSIBILITY_PREF', payload: 'stepFree' });
  }, [dispatch]);
  return (
    <ConcourseCopilotCard alertLang="en" onAlertLangChange={() => undefined} />
  );
}

describe('ConcourseCopilotCard', () => {
  beforeEach(() => {
    mockFetchTip.mockClear();
  });

  it('loads Places-backed tip and announces live gate pressure when provided', async () => {
    render(
      <EntryProvider>
        <ConcourseCopilotCard
          liveOccupancyPercent={33}
          alertLang="en"
          onAlertLangChange={() => undefined}
        />
      </EntryProvider>
    );

    await waitFor(() => {
      expect(
        screen.getByText(/Smart tip: Restroom 109 is a 3-minute walk/i)
      ).toBeInTheDocument();
    });

    expect(screen.getByText(/33% pressure/i)).toBeInTheDocument();
    expect(mockFetchTip).toHaveBeenCalledWith(
      expect.objectContaining({
        wheelchairAccessibleOnly: false,
      })
    );
  });

  it('requests wheelchair-accessible Places filtering when step-free is enabled', async () => {
    render(
      <EntryProvider>
        <CopilotWithStepFree />
      </EntryProvider>
    );

    await waitFor(() => {
      expect(
        mockFetchTip.mock.calls.some((c) => c[0]?.wheelchairAccessibleOnly === true)
      ).toBe(true);
    });
  });
});
