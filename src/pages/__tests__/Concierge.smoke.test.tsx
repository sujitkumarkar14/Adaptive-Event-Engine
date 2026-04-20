import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Concierge } from '../Concierge';

describe('Concierge', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders and toggles voice demo', async () => {
    vi.useFakeTimers();
    render(<Concierge />);
    expect(screen.getByRole('heading', { name: /Concierge/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Hold to Speak/i }));
    await act(async () => {
      vi.advanceTimersByTime(2100);
    });
    expect(screen.getByText(/step-free gate/i)).toBeInTheDocument();
  });
});
