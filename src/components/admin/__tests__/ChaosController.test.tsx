import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DEMO_ROLE_STORAGE_KEY } from '../../../contexts/AuthContext';
import { ChaosController } from '../ChaosController';

const mockDispatch = vi.fn();

vi.mock('../../../store/entryStore', () => ({
  useEntryStore: () => ({ dispatch: mockDispatch }),
}));

describe('ChaosController', () => {
  beforeEach(() => {
    mockDispatch.mockClear();
    localStorage.removeItem(DEMO_ROLE_STORAGE_KEY);
  });

  afterEach(() => {
    localStorage.removeItem(DEMO_ROLE_STORAGE_KEY);
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

  it('stores demo staff role and fires demo-role-changed for role switcher', () => {
    const dispatchEvt = vi.spyOn(window, 'dispatchEvent');
    render(<ChaosController />);
    fireEvent.click(screen.getByRole('button', { name: /^Staff$/i }));
    expect(localStorage.getItem(DEMO_ROLE_STORAGE_KEY)).toBe('staff');
    expect(dispatchEvt).toHaveBeenCalled();
    const evt = dispatchEvt.mock.calls.find((c) => c[0]?.type === 'demo-role-changed');
    expect(evt?.[0]?.type).toBe('demo-role-changed');
    dispatchEvt.mockRestore();
  });

  it('clears demo role when Use token is chosen', () => {
    localStorage.setItem(DEMO_ROLE_STORAGE_KEY, 'admin');
    render(<ChaosController />);
    fireEvent.click(screen.getByRole('button', { name: /use token/i }));
    expect(localStorage.getItem(DEMO_ROLE_STORAGE_KEY)).toBeNull();
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
