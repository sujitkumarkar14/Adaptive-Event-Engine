import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StarkMap } from '../StarkMap';

const SAMPLE_LINE = '_p~iF~ps|U_ulLnnqC_mqNvxq`@';

describe('StarkMap', () => {
  it('renders an SVG path when an encoded polyline is provided', () => {
    render(<StarkMap encodedPolyline={SAMPLE_LINE} label="Test map" />);
    expect(document.querySelector('svg path')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /test map/i })).toBeInTheDocument();
  });

  it('uses high-contrast smart styling when smartPathMode is on', () => {
    const { container } = render(
      <StarkMap encodedPolyline={SAMPLE_LINE} smartPathMode label="Smart" />
    );
    const path = container.querySelector('path');
    expect(path?.getAttribute('stroke')).toBe('#FFCC00');
  });

  it('shows a no-geometry fallback when polyline is null', () => {
    render(<StarkMap encodedPolyline={null} />);
    expect(screen.getByText(/no path geometry yet/i)).toBeInTheDocument();
  });

  it('renders restricted + holding overlays when priority clearance is active', () => {
    const { container } = render(
      <StarkMap encodedPolyline={null} priorityClearanceActive label="Clearance" />
    );
    expect(screen.getByText(/restricted/i)).toBeInTheDocument();
    expect(screen.getByText(/holding/i)).toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders multiple paths when layers are provided', () => {
    const { container } = render(
      <StarkMap
        layers={[
          { encodedPolyline: SAMPLE_LINE, variant: 'fan' },
          { encodedPolyline: SAMPLE_LINE, variant: 'emergency' },
        ]}
        label="Multi"
      />
    );
    const paths = container.querySelectorAll('svg path');
    expect(paths.length).toBeGreaterThanOrEqual(2);
  });

  it('renders smart reroute white tunnel overlay without priority clearance', () => {
    const { container } = render(
      <StarkMap encodedPolyline={SAMPLE_LINE} smartPathMode smartRerouteActive label="Reroute" />
    );
    const rects = container.querySelectorAll('svg rect');
    const whiteTunnel = Array.from(rects).find(
      (r) => r.getAttribute('fill') === '#ffffff' || r.getAttribute('fill')?.startsWith('#fff')
    );
    expect(whiteTunnel).toBeTruthy();
  });

  it('uses cyan exit stroke for parking / egress preview layers', () => {
    const { container } = render(
      <StarkMap layers={[{ encodedPolyline: SAMPLE_LINE, variant: 'exit' }]} label="Exit path" />
    );
    const path = container.querySelector('svg path');
    expect(path?.getAttribute('stroke')).toBe('#00E5FF');
  });
});
