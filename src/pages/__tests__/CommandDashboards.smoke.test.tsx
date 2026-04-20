import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TrafficCommand, AeroCommand, GateCommand } from '../CommandDashboards';

describe('Command dashboards', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('TrafficCommand shows congestion topology', () => {
    render(<TrafficCommand />);
    expect(screen.getByRole('heading', { name: /Command Matrix/i })).toBeInTheDocument();
    expect(screen.getByText(/88%/)).toBeInTheDocument();
  });

  it('AeroCommand shows hot path latency', () => {
    vi.useFakeTimers();
    render(<AeroCommand />);
    expect(screen.getByText(/ms/)).toBeInTheDocument();
  });

  it('GateCommand shows supervisor surface', () => {
    render(<GateCommand />);
    expect(screen.getByRole('heading', { name: /Gate Supervisor/i })).toBeInTheDocument();
  });
});
