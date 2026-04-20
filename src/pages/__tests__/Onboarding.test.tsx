import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { EntryProvider } from '../../store/entryStore';
import { Onboarding } from '../Onboarding';

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { uid: 'test-user' }, loading: false }),
}));

const fetchMock = vi.fn();
const persistMock = vi.fn();

vi.mock('../../lib/onboardingPreferences', async (importOriginal) => {
  const mod = await importOriginal<typeof import('../../lib/onboardingPreferences')>();
  return {
    ...mod,
    fetchOnboardingPreferences: (...args: unknown[]) => fetchMock(...args),
    persistOnboardingPreferences: (...args: unknown[]) => persistMock(...args),
  };
});

function renderOnboarding() {
  return render(
    <MemoryRouter>
      <EntryProvider>
        <Onboarding />
      </EntryProvider>
    </MemoryRouter>
  );
}

async function waitForInitialLoad() {
  await waitFor(() => {
    expect(screen.queryByText(/Loading your preferences/i)).not.toBeInTheDocument();
  });
}

describe('Onboarding', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    persistMock.mockReset();
    fetchMock.mockResolvedValue(null);
    persistMock.mockResolvedValue(undefined);
  });

  it('renders hero and allows transport selection', async () => {
    renderOnboarding();
    await waitForInitialLoad();
    expect(screen.getByText(/Travel/i)).toBeInTheDocument();
    const carBtn = screen.getByRole('radio', { name: /car/i });
    fireEvent.click(carBtn);
    expect(carBtn).toHaveClass(/bg-primary-container/);
  });

  it('loads saved preferences and hydrates the UI', async () => {
    fetchMock.mockResolvedValue({
      transportMode: 'Metro',
      accessibility: { stepFree: true, lowSensory: false, visualAid: false },
      journeyPhase: 'PRE_EVENT',
      onboardingCompleted: true,
    });
    renderOnboarding();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('test-user'));
    const metro = screen.getByRole('radio', { name: /metro/i });
    await waitFor(() => expect(metro).toHaveAttribute('aria-checked', 'true'));
  });

  it('Initialize System persists current selections', async () => {
    renderOnboarding();
    await waitForInitialLoad();
    fireEvent.click(screen.getByRole('radio', { name: /car/i }));
    fireEvent.click(screen.getByRole('button', { name: /Initialize System/i }));
    await waitFor(() => expect(persistMock).toHaveBeenCalled());
    expect(persistMock.mock.calls[0][0]).toBe('test-user');
    expect(persistMock.mock.calls[0][1]).toMatchObject({
      journeyPhase: 'IN_JOURNEY',
      transportMode: 'Car',
      onboardingCompleted: true,
    });
  });

  it('Skip configuration persists skip defaults', async () => {
    renderOnboarding();
    await waitForInitialLoad();
    fireEvent.click(screen.getByRole('button', { name: /Skip configuration/i }));
    await waitFor(() => expect(persistMock).toHaveBeenCalled());
    expect(persistMock.mock.calls[0][1]).toMatchObject({
      transportMode: null,
      journeyPhase: 'IN_JOURNEY',
      onboardingCompleted: true,
    });
  });

  it('shows save error and continue without saving', async () => {
    persistMock.mockRejectedValueOnce(new Error('network'));
    renderOnboarding();
    await waitForInitialLoad();
    fireEvent.click(screen.getByRole('button', { name: /Initialize System/i }));
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(screen.getByRole('alert')).toHaveTextContent(/Couldn't save preferences/i);
    fireEvent.click(screen.getByRole('button', { name: /Continue without saving/i }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('disables controls while saving', async () => {
    let resolveSave: () => void = () => {};
    const savePromise = new Promise<void>((r) => {
      resolveSave = r;
    });
    persistMock.mockImplementationOnce(() => savePromise);
    renderOnboarding();
    await waitForInitialLoad();
    fireEvent.click(screen.getByRole('button', { name: /Initialize System/i }));
    await waitFor(() => expect(screen.getByText(/Saving preferences/i)).toBeInTheDocument());
    const car = screen.getByRole('radio', { name: /car/i });
    expect(car).toBeDisabled();
    resolveSave();
    await waitFor(() => expect(screen.queryByText(/Saving preferences/i)).not.toBeInTheDocument());
  });

  it('shows fallback when hero image fails', async () => {
    renderOnboarding();
    await waitForInitialLoad();
    const img = screen.getByAltText(/Clean public transport interior/i);
    fireEvent.error(img);
    expect(screen.getByText(/Venue imagery unavailable/i)).toBeInTheDocument();
  });
});
