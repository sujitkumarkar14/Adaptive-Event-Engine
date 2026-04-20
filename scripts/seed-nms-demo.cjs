#!/usr/bin/env node
/**
 * Seeds `demoEvents/narendra-modi-stadium-demo` with event metadata, gates, slots,
 * aggregates/live gate pressure, and synthetic attendees (default 2000).
 *
 * Prerequisites: Application Default Credentials with Firestore write access
 *   export GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json
 *   # or `gcloud auth application-default login`
 *
 * Usage:
 *   node scripts/seed-nms-demo.cjs [projectId]
 */
const path = require('path');

let admin;
try {
  admin = require(path.join(__dirname, '..', 'functions', 'node_modules', 'firebase-admin'));
} catch {
  console.error('Install dependencies: cd functions && npm ci');
  process.exit(1);
}

const PROJECT =
  process.argv[2] ||
  process.env.GCLOUD_PROJECT ||
  process.env.GOOGLE_CLOUD_PROJECT ||
  process.env.FIREBASE_PROJECT ||
  '';

const EVENT_ID = 'narendra-modi-stadium-demo';
const ATTENDEE_COUNT = Math.min(3000, Math.max(500, parseInt(process.env.DEMO_SEED_COUNT || '2000', 10) || 2000));

/** Deterministic PRNG (Mulberry32) — repeatable across runs for the same index sequence. */
function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const GATES = ['GATE_NORTH', 'GATE_EAST', 'GATE_SOUTH', 'GATE_WEST'];

function main() {
  if (!PROJECT) {
    console.error('Set project: node scripts/seed-nms-demo.cjs YOUR_PROJECT_ID');
    process.exit(1);
  }
  if (!admin.apps.length) {
    admin.initializeApp({ projectId: PROJECT });
  }
  const db = admin.firestore();
  const baseLat = 23.0913;
  const baseLng = 72.5977;

  // Fixed calendar day for repeatable judge scripts (UTC).
  const bookingWindowStart = new Date('2026-06-01T04:00:00.000Z');
  const bookingWindowEnd = new Date('2026-06-01T14:00:00.000Z');
  const matchStartTime = new Date('2026-06-01T14:30:00.000Z');

  const batchSlots = [];
  for (let i = 0; i < 8; i++) {
    const start = new Date(matchStartTime.getTime() - (8 - i) * 30 * 60 * 1000);
    const end = new Date(start.getTime() + 25 * 60 * 1000);
    const slotId = `slot-${String(i + 1).padStart(2, '0')}`;
    batchSlots.push({
      id: slotId,
      ref: db.collection('demoEvents').doc(EVENT_ID).collection('slots').doc(slotId),
      data: {
        label: `Window ${i + 1}`,
        startTime: admin.firestore.Timestamp.fromDate(start),
        endTime: admin.firestore.Timestamp.fromDate(end),
        capacityTotal: 400,
        capacityRemaining: Math.max(0, 320 - i * 12),
        defaultGate: GATES[i % GATES.length],
        order: i,
      },
    });
  }

  const eventRef = db.collection('demoEvents').doc(EVENT_ID);

  const gatesBatch = GATES.map((gid, idx) => ({
    ref: db.collection('demoEvents').doc(EVENT_ID).collection('gates').doc(gid),
    data: {
      label: gid.replace(/_/g, ' '),
      lat: baseLat + (idx - 1.5) * 0.00025,
      lng: baseLng + (idx % 2 === 0 ? 0.0003 : -0.0003),
    },
  }));

  async function run() {
    const metaBatch = db.batch();
    metaBatch.set(eventRef, {
      venueName: 'Narendra Modi Stadium',
      venueLat: baseLat,
      venueLng: baseLng,
      matchStartTime: admin.firestore.Timestamp.fromDate(matchStartTime),
      bookingWindowStart: admin.firestore.Timestamp.fromDate(bookingWindowStart),
      bookingWindowEnd: admin.firestore.Timestamp.fromDate(bookingWindowEnd),
      demoMode: true,
      gates: GATES,
      eventId: EVENT_ID,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    for (const g of gatesBatch) {
      metaBatch.set(g.ref, g.data, { merge: true });
    }
    for (const s of batchSlots) {
      metaBatch.set(s.ref, s.data, { merge: true });
    }
    const liveRef = db.collection('demoEvents').doc(EVENT_ID).collection('aggregates').doc('live');
    metaBatch.set(liveRef, {
      gates: {
        GATE_NORTH: 68,
        GATE_EAST: 55,
        GATE_SOUTH: 72,
        GATE_WEST: 44,
      },
      attendeeProgressApprox: 0.42,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    await metaBatch.commit();
    console.log('Event, gates, slots, aggregates written.');

    const rand = mulberry32(0xae3600de);
    let written = 0;
    let b = db.batch();
    let n = 0;
    const flush = async () => {
      await b.commit();
      b = db.batch();
      n = 0;
    };

    for (let i = 0; i < ATTENDEE_COUNT; i++) {
      const ticketNumber = `NMS-AE360-${String(i + 1).padStart(6, '0')}`;
      const g = GATES[i % GATES.length];
      const slotIdx = i % batchSlots.length;
      const slotLabel = batchSlots[slotIdx].data.label;
      const ref = eventRef.collection('attendees').doc(ticketNumber);
      b.set(ref, {
        id: ticketNumber,
        name: `Demo Guest ${i + 1}`,
        ticketNumber,
        seatSection: `L${1 + (i % 5)}-${100 + (i % 40)}`,
        assignedGate: g,
        arrivalSlot: slotLabel,
        status: i % 7 === 0 ? 'checked_in' : 'not_arrived',
        stepFree: i % 23 === 0,
        lowSensory: i % 31 === 0,
        visualAid: i % 41 === 0,
        currentLat: baseLat + (rand() - 0.5) * 0.004,
        currentLng: baseLng + (rand() - 0.5) * 0.004,
        transportMode: ['Car', 'Metro', 'Shuttle'][i % 3],
      });
      n++;
      written++;
      if (n >= 450) {
        await flush();
      }
    }
    if (n > 0) await flush();
    console.log(`Seeded ${written} attendees under demoEvents/${EVENT_ID}/attendees/`);

    console.log('Done.');
  }

  run().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

main();
