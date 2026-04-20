import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Concierge } from '../Concierge';
import { EntryProvider } from '../../store/entryStore';

vi.mock('../../services/translationClient', () => ({
  translateAlertText: vi.fn().mockResolvedValue('Translated reply for demo.'),
}));

describe('Concierge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('submits a query and shows translated response', async () => {
    render(
      <MemoryRouter>
        <EntryProvider>
          <Concierge />
        </EntryProvider>
      </MemoryRouter>
    );
    fireEvent.change(screen.getByLabelText(/ask for directions/i), {
      target: { value: 'Where is gate A?' },
    });
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    await waitFor(() => {
      expect(screen.getByText(/Translated reply for demo/i)).toBeInTheDocument();
    });
  });
});
