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
    const carBtn = screen.getByRole('button', { name: /directions_carCar/i });
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
    fireEvent.click(screen.getByText(/Step-free access/i));
    fireEvent.click(screen.getByText(/Low-sensory environments/i));
    fireEvent.click(screen.getByText(/Visual aid support/i));
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
