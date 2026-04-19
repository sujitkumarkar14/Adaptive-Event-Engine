import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { StarkButton, StarkInput, StarkCard } from '../components/common/StarkComponents';
import { describe, it, expect, vi, afterEach } from 'vitest';

const starkPhase = vi.hoisted(() => ({ current: 'PRE_EVENT' as 'PRE_EVENT' | 'EMERGENCY' }));

vi.mock('../store/entryStore', () => ({
  useEntryStore: () => ({ state: { phase: starkPhase.current } }),
}));

describe('WCAG AAA Compliance: Stark Components', () => {
    afterEach(() => {
        starkPhase.current = 'PRE_EVENT';
    });

    it('StarkButton receives explicit tabIndex and passes aria-label', () => {
        render(<StarkButton aria-label="Confirm Action">Execute</StarkButton>);
        const button = screen.getByRole('button');
        
        expect(button).toBeInTheDocument();
        expect(button).toHaveAttribute('tabIndex', '0');
        expect(button).toHaveAttribute('aria-label', 'Confirm Action');
    });

    it('StarkInput binds native label correctly mapping wildcard htmlFor IDs', () => {
        render(<StarkInput label="Ticket Hash" placeholder="Enter Hash" />);
        // The component logic dictates the id is `stark-input-ticket-hash` natively.
        const input = screen.getByLabelText('Ticket Hash');
        
        expect(input).toBeInTheDocument();
        expect(input).toHaveAttribute('id', 'stark-input-ticket-hash');
    });

    it('StarkInput triggers blur on Escape key capturing screen reader focus locks', () => {
        render(<StarkInput label="Search" />);
        const input = screen.getByLabelText('Search');
        
        input.focus();
        expect(input).toHaveFocus();
        
        // Simulating the user pressing escape natively to blur
        fireEvent.keyDown(input, { key: 'Escape', code: 'Escape' });
        
        expect(input).not.toHaveFocus();
    });

    it('StarkCard functions as a region and captures Enter Key for native click logic', () => {
        const mockClick = vi.fn();
        render(<StarkCard title="Zone Alpha" onClick={mockClick}>Content</StarkCard>);
        
        const cardRegion = screen.getByRole('region');
        
        fireEvent.keyDown(cardRegion, { key: 'Enter', code: 'Enter' });
        
        expect(mockClick).toHaveBeenCalledTimes(1);
        expect(cardRegion).toHaveAttribute('tabIndex', '0');
    });

    it('StarkButton uses error palette when phase is EMERGENCY', () => {
        starkPhase.current = 'EMERGENCY';
        render(<StarkButton>Evac</StarkButton>);
        const button = screen.getByRole('button');
        expect(button.className).toMatch(/error/);
        starkPhase.current = 'PRE_EVENT';
    });

});
