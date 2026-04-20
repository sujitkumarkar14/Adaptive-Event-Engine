import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StadiumVenueMapSvg } from '../StadiumVenueMapSvg';
import { DEFAULT_FACILITY_STATUS, mergeFacilityStatus } from '../../../lib/demoVenueFacilityModel';

describe('StadiumVenueMapSvg', () => {
  it('renders schematic and Gate A labels', () => {
    render(<StadiumVenueMapSvg facilityStatus={DEFAULT_FACILITY_STATUS} highlightTier={2} />);

    expect(screen.getByRole('img', { name: /stadium schematic/i })).toBeInTheDocument();
    expect(
      screen.getByText((_, el) => Boolean(el?.tagName === 'text' && /Gate A/i.test(el.textContent ?? '')))
    ).toBeInTheDocument();
    expect(screen.getByText(/Esc 131/i)).toBeInTheDocument();
    expect(screen.getByText(/Esc 145/i)).toBeInTheDocument();
    expect(screen.getByText(/Lift 41/i)).toBeInTheDocument();
  });

  it('highlights tier on map when provided', () => {
    render(<StadiumVenueMapSvg facilityStatus={DEFAULT_FACILITY_STATUS} highlightTier={3} />);

    expect(screen.getByText(/your tier/)).toBeInTheDocument();
    const bowl = document.getElementById('venue-svg-seat-bowl');
    expect(bowl).toBeTruthy();
    expect(bowl).toHaveAttribute('aria-labelledby', 'venue-svg-seat-bowl-title');
  });

  it('renders reduced-capacity elevator when status is merged from live data', () => {
    const live = mergeFacilityStatus({
      elevators: { 'EV-43': 'reduced' },
    });
    render(<StadiumVenueMapSvg facilityStatus={live} highlightTier={null} />);

    expect(screen.getByText(/Lift 43/i)).toBeInTheDocument();
  });
});
