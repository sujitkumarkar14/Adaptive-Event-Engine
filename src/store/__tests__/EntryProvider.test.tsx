import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EntryProvider, useEntryStore } from '../entryStore';

function PhaseProbe() {
  const { state } = useEntryStore();
  return <span data-testid="phase">{state.phase}</span>;
}

describe('EntryProvider', () => {
  it('provides initial PRE_EVENT state to children', () => {
    render(
      <EntryProvider>
        <PhaseProbe />
      </EntryProvider>
    );
    expect(screen.getByTestId('phase')).toHaveTextContent('PRE_EVENT');
  });
});
