import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StadiumVenueMapSvg } from '../StadiumVenueMapSvg';
import { DEFAULT_FACILITY_STATUS } from '../../../lib/demoVenueFacilityModel';

describe('StadiumVenueMapSvg', () => {
  it('renders schematic and Gate A labels', () => {
    render(<StadiumVenueMapSvg facilityStatus={DEFAULT_FACILITY_STATUS} highlightTier={2} />);

    expect(screen.getByRole('img', { name: /stadium schematic/i })).toBeInTheDocument();
    expect(screen.getByText(/Gate A/i)).toBeInTheDocument();
    expect(screen.getByText(/Esc 131/i)).toBeInTheDocument();
    expect(screen.getByText(/Esc 145/i)).toBeInTheDocument();
    expect(screen.getByText(/Lift 41/i)).toBeInTheDocument();
  });

  it('highlights tier on map when provided', () => {
    render(<StadiumVenueMapSvg facilityStatus={DEFAULT_FACILITY_STATUS} highlightTier={3} />);

    expect(screen.getByText(/L3 · your tier/i)).toBeInTheDocument();
  });
});
