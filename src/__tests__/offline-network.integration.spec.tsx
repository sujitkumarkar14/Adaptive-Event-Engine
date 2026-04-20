import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EntryProvider, useEntryStore } from '../store/entryStore';
import { DataFreshnessFooter } from '../components/navigation/Navigation';

function NetworkToggles() {
  const { dispatch } = useEntryStore();
  return (
    <div>
      <button type="button" onClick={() => dispatch({ type: 'SET_NETWORK_STATUS', payload: false })}>
        go-offline
      </button>
      <button type="button" onClick={() => dispatch({ type: 'SET_NETWORK_STATUS', payload: true })}>
        go-online
      </button>
    </div>
  );
}

describe('offline / recovery — shell sync status', () => {
  it('footer shows Offline then Live when toggling network state', () => {
    render(
      <EntryProvider>
        <NetworkToggles />
        <DataFreshnessFooter />
      </EntryProvider>
    );

    expect(screen.getByText(/Sync Status: Live/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /go-offline/i }));
    expect(screen.getByText(/Sync Status: Offline/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /go-online/i }));
    expect(screen.getByText(/Sync Status: Live/)).toBeInTheDocument();
  });
});
