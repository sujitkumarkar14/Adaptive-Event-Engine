import { functions } from '../lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { devLog, devWarn } from '../lib/debug';
import { PARKING_LOT_ORIGIN } from '../lib/constants';
import { isRoutingMockEnabled } from '../lib/routingEnv';

/**
 * When `VITE_USE_ROUTING_MOCK` is not `"false"`, use the local mock geometry.
 * Set `VITE_USE_ROUTING_MOCK=false` in production to call `calculateOptimalPath` (HTTPS callable).
 */

/** Matches callable `calculateOptimalPath` + Routes priority mesh. */
export type RoutePriority = 'standard' | 'vip' | 'emergency';

interface RoutingRequest {
    originLat: number;
    originLng: number;
    destinationGate: string;
    stepFreeRequired: boolean;
    priority?: RoutePriority;
    /** When true, destination is the static parking zone (ignore gate geometry for terminus). */
    returnToVehicle?: boolean;
}

interface RoutingResponse {
    routeId: string;
    pathNodes: Array<{ lat: number; lng: number; description?: string }>;
    perimeterToSeatTime: string;
    status: string;
    encodedPolyline?: string;
    distanceMeters?: number;
    durationSeconds?: number;
    priority?: RoutePriority;
}

const MOCK_ENCODED_POLYLINE = '_p~iF~ps|U_ulLnnqC_mqNvxq`@';

function mockLineForPriority(p: RoutePriority | undefined): string {
    if (p === 'vip') {
        return 'wocsF`b}u_@}@wAqCnE';
    }
    if (p === 'emergency') {
        return 'oocsFjb}u_@_@?}L?kL';
    }
    return MOCK_ENCODED_POLYLINE;
}

/**
 * Analytical Path: Routing Engine
 * Communicates with the Cloud Function wrapper to consume BigQuery analytics and Identity constraints.
 */
export const calculateOptimalPath = async (req: RoutingRequest): Promise<RoutingResponse | null> => {

    if (isRoutingMockEnabled()) {
        const pr: RoutePriority = req.priority ?? 'standard';
        const exitMode = Boolean(req.returnToVehicle);
        devLog(
            `[Service] Mock route → ${req.destinationGate} stepFree=${req.stepFreeRequired} priority=${pr} exit=${exitMode}`
        );
        const encodedPolyline = exitMode ? 'wocsFjb}u_@uCxH~B' : mockLineForPriority(pr);
        const suiteTime = pr === 'vip' ? '14 mins (suite)' : pr === 'emergency' ? '6 mins (service)' : undefined;
        return {
            routeId: `rt_mock_${Date.now()}`,
            encodedPolyline,
            distanceMeters: exitMode ? 680 : pr === 'emergency' ? 890 : pr === 'vip' ? 510 : 420,
            durationSeconds: exitMode ? 540 : pr === 'emergency' ? 360 : pr === 'vip' ? 840 : req.stepFreeRequired ? 1080 : 720,
            pathNodes: [
                { lat: req.originLat, lng: req.originLng, description: "Current Location" },
                exitMode
                    ? { lat: PARKING_LOT_ORIGIN.lat, lng: PARKING_LOT_ORIGIN.lng, description: 'Parking zone' }
                    : { lat: 34.0522, lng: -118.2437, description: req.stepFreeRequired ? "Elevator Bank C" : "Stairwell B" },
                ...(exitMode
                    ? []
                    : [{ lat: 34.0530, lng: -118.2450, description: req.destinationGate }]),
            ],
            perimeterToSeatTime: exitMode
                ? '9 mins to lot'
                : suiteTime ?? (req.stepFreeRequired ? "18 mins" : "12 mins"),
            status: "OPTIMIZED_VIA_MOCK",
            priority: pr,
        };
    }

    try {
        const callable = httpsCallable<RoutingRequest, RoutingResponse>(functions, 'calculateOptimalPath');
        const response = await callable(req);
        return response.data;
    } catch (e) {
        devWarn('Routing failure executing Analytical Engine:', e);
        return null;
    }
};
