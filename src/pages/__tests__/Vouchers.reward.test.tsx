import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RewardUnlockedCard } from '../Vouchers';

describe('RewardUnlockedCard', () => {
  it('renders voucher code and optional dismiss', () => {
    const onDismiss = vi.fn();
    render(<RewardUnlockedCard voucherCode="SMART_MOVE_10" onDismiss={onDismiss} />);
    expect(screen.getByText('SMART_MOVE_10')).toBeInTheDocument();
    expect(screen.getByText(/Reward unlocked/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /dismiss/i }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
