import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Unauthorized } from '../Unauthorized';

describe('Unauthorized', () => {
  it('renders access denied messaging and dashboard link', () => {
    render(
      <MemoryRouter>
        <Unauthorized />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /access denied/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to dashboard/i })).toHaveAttribute('href', '/dashboard');
  });
});
