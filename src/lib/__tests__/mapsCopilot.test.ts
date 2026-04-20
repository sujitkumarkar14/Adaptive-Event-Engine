import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockHttpsCallable = vi.hoisted(() =>
  vi.fn().mockImplementation(() =>
    vi.fn().mockResolvedValue({
      data: {
        tip: 'Smart tip from callable.',
        places: [{ name: 'Restroom A' }],
      },
    })
  )
);

vi.mock('firebase/functions', () => ({
  httpsCallable: mockHttpsCallable,
}));

vi.mock('../firebase', () => ({
  functions: {},
}));

describe('fetchConcourseCopilotTip', () => {
  beforeEach(() => {
    mockHttpsCallable.mockClear();
    mockHttpsCallable.mockImplementation(() =>
      vi.fn().mockResolvedValue({
        data: {
          tip: 'Smart tip from callable.',
          places: [{ name: 'Restroom A' }],
        },
      })
    );
  });

  it('invokes searchNearbyAmenities callable with coordinates and wheelchair flag', async () => {
    const { fetchConcourseCopilotTip } = await import('../maps');
    const result = await fetchConcourseCopilotTip({
      latitude: 33.95,
      longitude: -118.33,
      wheelchairAccessibleOnly: true,
    });

    expect(mockHttpsCallable).toHaveBeenCalledWith({}, 'searchNearbyAmenities');
    const callable = mockHttpsCallable.mock.results[0]?.value as ReturnType<typeof vi.fn>;
    expect(callable).toHaveBeenCalledWith(
      expect.objectContaining({
        latitude: 33.95,
        longitude: -118.33,
        wheelchairAccessibleOnly: true,
      })
    );
    expect(result.tip).toContain('Smart tip');
    expect(result.places).toHaveLength(1);
  });
});
