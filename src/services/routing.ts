import { functions } from '../lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { devLog, devWarn } from '../lib/debug';

/**
 * When `VITE_USE_ROUTING_MOCK` is not `"false"`, use the local mock geometry.
 * Set `VITE_USE_ROUTING_MOCK=false` in production to call `calculateOptimalPath` (HTTPS callable).
 */
const USE_ROUTING_MOCK = import.meta.env.VITE_USE_ROUTING_MOCK !== 'false';

interface RoutingRequest {
    originLat: number;
    originLng: number;
    destinationGate: string;
    stepFreeRequired: boolean;
}

interface RoutingResponse {
    routeId: string;
    pathNodes: any[];
    perimeterToSeatTime: string;
    status: string;
}

/**
 * Analytical Path: Routing Engine
 * Communicates with the Cloud Function wrapper to consume BigQuery analytics and Identity constraints.
 */
export const calculateOptimalPath = async (req: RoutingRequest): Promise<RoutingResponse | null> => {

    if (USE_ROUTING_MOCK) {
        devLog(`[Service] Generating optimal offline/mock route to ${req.destinationGate}. StepFree: ${req.stepFreeRequired}`);
        return {
            routeId: `rt_mock_${Date.now()}`,
            pathNodes: [
                { lat: req.originLat, lng: req.originLng, description: "Current Location" },
                { lat: 34.0522, lng: -118.2437, description: req.stepFreeRequired ? "Elevator Bank C" : "Stairwell B" },
                { lat: 34.0530, lng: -118.2450, description: req.destinationGate }
            ],
            perimeterToSeatTime: req.stepFreeRequired ? "18 mins" : "12 mins",
            status: "OPTIMIZED_VIA_MOCK"
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
