import React, { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { StarkButton, StarkInput, StarkCard } from '../components/common/StarkComponents';
import { functions } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { DEFAULT_DEMO_EVENT_ID } from '../lib/demoConstants';
import { writeDemoSeatSection } from '../lib/demoSession';
import { StadiumSeatFinderSvg } from '../components/demo/StadiumSeatFinderSvg';
import { useEntryStore } from '../store/entryStore';
import { getHttpsCallableUserMessage } from '../lib/errors';

const lookupDemoAttendee = httpsCallable(functions, 'lookupDemoAttendee');

type AttendeePayload = {
  name: string;
  ticketNumber: string;
  seatSection: string;
  assignedGate: string;
  arrivalSlot: string;
  status: string;
  stepFree: boolean;
  lowSensory: boolean;
  visualAid: boolean;
};

export const CheckIn = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useEntryStore();
  const eventId = state.demoEventId ?? DEFAULT_DEMO_EVENT_ID;
  const [ticket, setTicket] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [found, setFound] = useState<AttendeePayload | null>(null);

  const runLookup = async () => {
    const q = ticket.trim();
    if (!q) return;
    setLoading(true);
    setError(null);
    setFound(null);
    try {
      const res = await lookupDemoAttendee({ eventId, ticketNumber: q });
      const data = res.data as { found: boolean; attendee?: AttendeePayload };
      if (!data.found || !data.attendee) {
        setError('No attendee match for that ticket in the demo event. Check the number or seed demo data.');
        return;
      }
      setFound(data.attendee);
      dispatch({ type: 'SET_DEMO_SEAT_SECTION', payload: data.attendee.seatSection });
      writeDemoSeatSection(data.attendee.seatSection);
    } catch (e: unknown) {
      setError(getHttpsCallableUserMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="flex flex-col h-full max-w-2xl" aria-labelledby="checkin-heading">
      <div className="mb-8">
        <h1 id="checkin-heading" className="text-4xl font-black tracking-tighter uppercase mb-2">
          Check-in scanner
        </h1>
        <p className="text-on-surface-variant font-bold text-xs tracking-widest uppercase">
          Demo lookup — ticket number
        </p>
        <p className="mt-2 text-[10px] font-bold text-outline uppercase tracking-widest">
          Event: {eventId}
        </p>
      </div>

      <StarkCard title="Search" subtitle="Type or paste ticket (e.g. NMS-AE360-000001)">
        <div className="mt-4 space-y-4">
          <StarkInput
            label="Ticket number"
            value={ticket}
            onChange={(e) => setTicket(e.target.value)}
            placeholder="NMS-AE360-000001"
            disabled={loading}
            autoComplete="off"
          />
          <StarkButton fullWidth type="button" disabled={loading} onClick={runLookup}>
            {loading ? 'Looking up…' : 'Lookup attendee'}
          </StarkButton>
        </div>
      </StarkCard>

      {error ? (
        <p role="alert" className="mt-6 border-2 border-error p-4 text-sm font-bold text-error">
          {error}
        </p>
      ) : null}

      {found ? (
        <StarkCard title="Attendee" subtitle={found.status} active className="mt-6 border-4 border-black">
          <dl className="mt-4 space-y-2 text-sm font-bold uppercase tracking-widest">
            <div>
              <dt className="text-[10px] text-outline">Name</dt>
              <dd className="normal-case tracking-normal text-on-surface">{found.name}</dd>
            </div>
            <div>
              <dt className="text-[10px] text-outline">Ticket</dt>
              <dd className="font-mono">{found.ticketNumber}</dd>
            </div>
            <div>
              <dt className="text-[10px] text-outline">Section</dt>
              <dd>{found.seatSection}</dd>
            </div>
            <div>
              <dt className="text-[10px] text-outline">Gate</dt>
              <dd>{found.assignedGate}</dd>
            </div>
            <div>
              <dt className="text-[10px] text-outline">Arrival slot</dt>
              <dd>{found.arrivalSlot}</dd>
            </div>
            <div>
              <dt className="text-[10px] text-outline">Accessibility</dt>
              <dd className="normal-case tracking-normal text-xs">
                Step-free: {found.stepFree ? 'yes' : 'no'} · Low sensory: {found.lowSensory ? 'yes' : 'no'} · Visual
                aid: {found.visualAid ? 'yes' : 'no'}
              </dd>
            </div>
          </dl>
          <div className="mt-8 border-t border-outline-variant pt-6">
            <StadiumSeatFinderSvg seatSection={found.seatSection} className="mt-0" />
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <StarkButton fullWidth variant="secondary" type="button" onClick={() => navigate('/dashboard')}>
              Open dashboard
            </StarkButton>
            <StarkButton fullWidth type="button" onClick={() => navigate('/booking')}>
              Arrival booking
            </StarkButton>
          </div>
        </StarkCard>
      ) : null}
    </section>
  );
};

export default CheckIn;
