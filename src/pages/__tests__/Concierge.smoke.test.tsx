import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Concierge } from '../Concierge';
import { EntryProvider } from '../../store/entryStore';

describe('Concierge', () => {
  it('renders typed assistance and does not advertise voice recognition', () => {
    render(
      <MemoryRouter>
        <EntryProvider>
          <Concierge />
        </EntryProvider>
      </MemoryRouter>
    );
    expect(screen.getByRole('heading', { name: /Concierge/i })).toBeInTheDocument();
    expect(screen.getByText(/Voice input is not available/i)).toBeInTheDocument();
    expect(screen.getByText(/no speech recognition/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Hold to Speak/i })).not.toBeInTheDocument();
  });
});
