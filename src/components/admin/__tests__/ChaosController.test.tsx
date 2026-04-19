import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChaosController } from '../ChaosController';

const mockDispatch = vi.fn();

vi.mock('../../../store/entryStore', () => ({
  useEntryStore: () => ({ dispatch: mockDispatch }),
}));

describe('ChaosController', () => {
  beforeEach(() => {
    mockDispatch.mockClear();
  });

  it('dispatches SET_NETWORK_STATUS false when killing network', () => {
    render(<ChaosController />);
    fireEvent.click(screen.getByRole('button', { name: /Kill Network/i }));
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'SET_NETWORK_STATUS', payload: false });
  });

  it('dispatches API_FAILURE when simulating API crush', () => {
    render(<ChaosController />);
    fireEvent.click(screen.getByRole('button', { name: /Simulate API Crush/i }));
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'API_FAILURE',
      payload: '502 Bad Gateway Vertex',
    });
  });

  it('dispatches TRIGGER_EMERGENCY and announces evacuation for evac drill', () => {
    const speak = vi.spyOn(window.speechSynthesis, 'speak').mockImplementation(() => {});
    render(<ChaosController />);
    fireEvent.click(screen.getByRole('button', { name: /emergency evacuation drill/i }));
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'TRIGGER_EMERGENCY' });
    expect(speak).toHaveBeenCalled();
    const utterance = speak.mock.calls[0][0] as SpeechSynthesisUtterance;
    expect(utterance.text.length).toBeGreaterThan(10);
  });
});
