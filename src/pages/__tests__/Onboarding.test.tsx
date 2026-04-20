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
});
