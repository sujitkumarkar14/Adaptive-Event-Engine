import React from 'react';
import { Link } from 'react-router-dom';
import { StarkButton } from '../components/common/StarkComponents';

/**
 * Shown when a signed-in user opens a route their role cannot access.
 */
export const Unauthorized = () => {
  return (
    <section
      className="max-w-lg mx-auto py-16 px-4"
      aria-labelledby="unauthorized-heading"
    >
      <h1 id="unauthorized-heading" className="text-3xl font-black uppercase tracking-tighter mb-4">
        Access denied
      </h1>
      <p className="text-sm font-bold text-on-surface-variant uppercase tracking-widest mb-8 border-l-4 border-error pl-4">
        This surface is restricted to operations staff. Return to your journey dashboard.
      </p>
      <Link to="/dashboard">
        <StarkButton fullWidth className="tracking-widest">
          Back to dashboard
        </StarkButton>
      </Link>
    </section>
  );
};

export default Unauthorized;
