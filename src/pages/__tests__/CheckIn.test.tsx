import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CheckIn } from '../CheckIn';
import { EntryProvider } from '../../store/entryStore';

const lookupMock = vi.hoisted(() => vi.fn());

vi.mock('firebase/functions', () => ({
  httpsCallable: vi.fn(() => lookupMock),
}));

vi.mock('../../lib/firebase', () => ({
  functions: {},
}));

function renderCheckIn() {
  return render(
    <MemoryRouter>
      <EntryProvider>
        <CheckIn />
      </EntryProvider>
    </MemoryRouter>
  );
}

describe('CheckIn', () => {
  beforeEach(() => {
    lookupMock.mockReset();
  });

  it('shows not found message when lookup returns empty', async () => {
    lookupMock.mockResolvedValue({ data: { found: false } });
    renderCheckIn();
    fireEvent.change(screen.getByLabelText(/ticket number/i), { target: { value: 'UNKNOWN' } });
    fireEvent.click(screen.getByRole('button', { name: /lookup attendee/i }));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  it('shows attendee summary when found', async () => {
    lookupMock.mockResolvedValue({
      data: {
        found: true,
        attendee: {
          name: 'Demo Guest',
          ticketNumber: 'NMS-AE360-000001',
          seatSection: 'L1-101',
          assignedGate: 'GATE_NORTH',
          arrivalSlot: 'Window 1',
          status: 'not_arrived',
          stepFree: false,
          lowSensory: false,
          visualAid: false,
        },
      },
    });
    renderCheckIn();
    fireEvent.change(screen.getByLabelText(/ticket number/i), { target: { value: 'NMS-AE360-000001' } });
    fireEvent.click(screen.getByRole('button', { name: /lookup attendee/i }));
    await waitFor(() => {
      expect(screen.getByText(/Demo Guest/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/GATE_NORTH/i)).toBeInTheDocument();
    expect(screen.getByText(/your tier L1/i)).toBeInTheDocument();
  });
});
