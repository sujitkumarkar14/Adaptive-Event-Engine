import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StadiumSeatFinderSvg } from '../StadiumSeatFinderSvg';

describe('StadiumSeatFinderSvg', () => {
  it('renders bowl map and highlights the parsed tier', () => {
    render(<StadiumSeatFinderSvg seatSection="L2-110" />);

    expect(screen.getByText(/your tier L2/i)).toBeInTheDocument();
    expect(screen.getByRole('figure', { name: /tier 2 of 5/i })).toBeInTheDocument();
    expect(screen.getByText(/L2 · you/i)).toBeInTheDocument();
  });

  it('shows L5 upper tier when ticket is L5', () => {
    render(<StadiumSeatFinderSvg seatSection="L5-001" />);

    expect(screen.getByText(/your tier L5/i)).toBeInTheDocument();
    expect(screen.getByText(/L5 · you/i)).toBeInTheDocument();
  });

  it('shows status message when section label is not demo format', () => {
    render(<StadiumSeatFinderSvg seatSection="VIP-A" />);

    const status = screen.getByRole('status');
    expect(status).toHaveTextContent(/did not match/i);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
