import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Vouchers } from '../Vouchers';

describe('Vouchers', () => {
  it('renders access credentials and QR region', () => {
    render(<Vouchers />);
    expect(screen.getByRole('heading', { name: /access credentials/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/ticket qr code/i)).toBeInTheDocument();
  });
});
