import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRef, useState } from 'react';

function FocusRecoveryDemo() {
  const [open, setOpen] = useState(false);
  const openerRef = useRef<HTMLButtonElement>(null);

  return (
    <div>
      <button ref={openerRef} type="button" onClick={() => setOpen(true)}>
        open-panel
      </button>
      {open ? (
        <div role="dialog" aria-modal="true" aria-labelledby="dlg-title">
          <h2 id="dlg-title">Demo panel</h2>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              queueMicrotask(() => openerRef.current?.focus());
            }}
          >
            close-panel
          </button>
        </div>
      ) : null}
    </div>
  );
}

describe('a11y: focus recovery', () => {
  it('returns focus to trigger when panel closes', async () => {
    const user = userEvent.setup();
    render(<FocusRecoveryDemo />);
    const opener = screen.getByRole('button', { name: /open-panel/i });
    await user.click(opener);
    await user.click(screen.getByRole('button', { name: /close-panel/i }));
    expect(opener).toHaveFocus();
  });
});
