import React, { useState } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PageErrorBoundary } from '../PageErrorBoundary';

function ThrowOnDemand({ boom }: { boom: boolean }) {
  if (boom) {
    throw new Error('forced render failure');
  }
  return <span>ok</span>;
}

function Harness() {
  const [boom, setBoom] = useState(false);
  return (
    <PageErrorBoundary>
      <button type="button" onClick={() => setBoom(true)}>
        trigger error
      </button>
      <ThrowOnDemand boom={boom} />
    </PageErrorBoundary>
  );
}

describe('PageErrorBoundary', () => {
  const err = vi.spyOn(console, 'error').mockImplementation(() => {});

  beforeEach(() => {
    err.mockClear();
  });

  afterEach(() => {
    err.mockRestore();
  });

  it('renders children when there is no error', () => {
    render(
      <MemoryRouter>
        <PageErrorBoundary>
          <span>child</span>
        </PageErrorBoundary>
      </MemoryRouter>
    );
    expect(screen.getByText('child')).toBeInTheDocument();
  });

  it('shows assertive alert and recovery actions when a child throws', () => {
    render(
      <MemoryRouter>
        <Harness />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /trigger error/i }));

    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('aria-live', 'assertive');
    expect(screen.getByText(/couldn't load/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /go to dashboard/i })).toBeInTheDocument();
  });
});
