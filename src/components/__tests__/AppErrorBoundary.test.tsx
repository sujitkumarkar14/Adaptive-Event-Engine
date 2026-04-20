import React, { useState } from 'react';
import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AppErrorBoundary } from '../AppErrorBoundary';

function ThrowAfterClick() {
  const [bad, setBad] = useState(false);
  if (bad) throw new Error('app level');
  return <button onClick={() => setBad(true)}>break-app</button>;
}

describe('AppErrorBoundary', () => {
  const err = vi.spyOn(console, 'error').mockImplementation(() => {});

  beforeEach(() => {
    err.mockClear();
  });

  afterAll(() => {
    err.mockRestore();
  });

  it('renders global recovery UI when a child throws', () => {
    render(
      <AppErrorBoundary>
        <ThrowAfterClick />
      </AppErrorBoundary>
    );
    fireEvent.click(screen.getByText('break-app'));
    expect(screen.getByRole('alert')).toHaveTextContent(/couldn.*t load the app/i);
    expect(screen.getByRole('button', { name: /reload/i })).toBeInTheDocument();
  });
});
