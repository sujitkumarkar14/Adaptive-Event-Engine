import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { EntryProvider } from '../../store/entryStore';
import { Onboarding } from '../Onboarding';

describe('Onboarding', () => {
  it('renders hero and allows transport selection', () => {
    render(
      <MemoryRouter>
        <EntryProvider>
          <Onboarding />
        </EntryProvider>
      </MemoryRouter>
    );
    expect(screen.getByText(/Travel/i)).toBeInTheDocument();
    const carBtn = screen.getByRole('radio', { name: /car/i });
    fireEvent.click(carBtn);
    expect(carBtn).toHaveClass(/bg-primary-container/);
  });

  it('toggles step-free and low-sensory preferences', () => {
    render(
      <MemoryRouter>
        <EntryProvider>
          <Onboarding />
        </EntryProvider>
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole('switch', { name: /step-free access/i }));
    fireEvent.click(screen.getByRole('switch', { name: /low-sensory environments/i }));
    fireEvent.click(screen.getByRole('switch', { name: /visual aid support/i }));
  });

  it('shows Initialize System and skip configuration', () => {
    render(
      <MemoryRouter>
        <EntryProvider>
          <Onboarding />
        </EntryProvider>
      </MemoryRouter>
    );
    expect(screen.getByRole('button', { name: /Initialize System/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Skip configuration/i })).toBeInTheDocument();
  });
});
