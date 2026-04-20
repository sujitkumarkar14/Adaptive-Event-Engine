import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EntryProvider, useEntryStore } from '../store/entryStore';

function Probe() {
  const { state } = useEntryStore();
  return <span data-testid="dm">{state.demoMode ? 'demo' : 'plain'}</span>;
}

describe('EntryProvider demo hydrate', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });
  afterEach(() => {
    sessionStorage.clear();
  });

  it('reads demo flags from sessionStorage on first init', () => {
    sessionStorage.setItem('ae360_demo_mode', '1');
    sessionStorage.setItem('ae360_demo_event_id', 'narendra-modi-stadium-demo');
    render(
      <EntryProvider>
        <Probe />
      </EntryProvider>
    );
    expect(screen.getByTestId('dm')).toHaveTextContent('demo');
  });
});
