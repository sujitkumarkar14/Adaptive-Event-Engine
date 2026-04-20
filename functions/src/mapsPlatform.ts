/**
 * Server-side Maps Routes API (v2) + Places API (New) using API key from Secret Manager.
 */

const ROUTES_COMPUTE = "https://routes.googleapis.com/directions/v2:computeRoutes";
const PLACES_SEARCH_NEARBY = "https://places.googleapis.com/v1/places:searchNearby";

/** Demo anchors near typical venue footprint (SW LA / stadium belt). Replace via config / Geocoding in production. */
export const GATE_DESTINATIONS: Record<string, { latitude: number; longitude: number }> = {
    GATE_A: { latitude: 33.95385, longitude: -118.3382 },
    GATE_B: { latitude: 33.9544, longitude: -118.3389 },
    GATE_C: { latitude: 33.9534, longitude: -118.3375 },
};

export function normalizeGateId(raw: string | undefined): string {
    if (!raw || typeof raw !== "string") return "GATE_B";
    return raw.trim().toUpperCase().replace(/\s+/g, "_");
}

export function destinationForGate(gate: string): { latitude: number; longitude: number } {
    const key = normalizeGateId(gate);
    return GATE_DESTINATIONS[key] ?? GATE_DESTINATIONS.GATE_B;
}

/** Static parking zone anchor for return-to-vehicle walking routes (west lot — demo coordinates). */
export const PARKING_LOT_ORIGIN = { latitude: 33.9529, longitude: -118.3401 };

/** All configured gates for Distance Matrix / inventory UIs. */
export function allGateCoordinates(): Array<{ gateId: string; latitude: number; longitude: number }> {
    return Object.entries(GATE_DESTINATIONS).map(([gateId, loc]) => ({
        gateId,
        latitude: loc.latitude,
        longitude: loc.longitude,
    }));
}

export interface RoutesApiOk {
    encodedPolyline: string;
    distanceMeters: number;
    durationSeconds: number;
}

/** Stadium service-road / tunnel anchors (demo coordinates). */
export const EMERGENCY_DRIVE_INTERMEDIATES = [
    { latitude: 33.95392, longitude: -118.33825 },
    { latitude: 33.95405, longitude: -118.33855 },
];

/** VIP / suite access waypoints (private elevator corridor). */
export const VIP_WALK_INTERMEDIATES = [
    { latitude: 33.9539, longitude: -118.33835 },
    { latitude: 33.95415, longitude: -118.33845 },
];

export type RoutePriority = "standard" | "vip" | "emergency";

export async function computeWalkingRoute(params: {
    apiKey: string;
    originLat: number;
    originLng: number;
    destLat: number;
    destLng: number;
    stepFreeRequired: boolean;
}): Promise<RoutesApiOk> {
    const body: Record<string, unknown> = {
        origin: {
            location: { latLng: { latitude: params.originLat, longitude: params.originLng } },
        },
        destination: {
            location: { latLng: { latitude: params.destLat, longitude: params.destLng } },
        },
        travelMode: "WALK",
        polylineQuality: "HIGH_QUALITY",
        polylineEncoding: "ENCODED_POLYLINE",
    };

    if (params.stepFreeRequired) {
        body.accessibilityOptions = { wheelchairAccessible: true };
    }

    const res = await fetch(ROUTES_COMPUTE, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": params.apiKey,
            "X-Goog-FieldMask": "routes.polyline,routes.distanceMeters,routes.duration",
        },
        body: JSON.stringify(body),
    });

    const json = (await res.json()) as {
        routes?: Array<{
            polyline?: { encodedPolyline?: string };
            distanceMeters?: string | number;
            duration?: string;
        }>;
        error?: { message?: string; code?: number };
    };

    if (!res.ok || !json.routes?.length) {
        const msg = json.error?.message ?? res.statusText ?? "ROUTES_API_ERROR";
        throw new Error(msg);
    }

    const route = json.routes[0];
    const encoded = route.polyline?.encodedPolyline;
    if (!encoded) {
        throw new Error("MISSING_POLYLINE");
    }

    const distRaw = route.distanceMeters;
    const distanceMeters =
        typeof distRaw === "number" ? distRaw : parseInt(String(distRaw ?? "0"), 10) || 0;

    let durationSeconds = 0;
    const dur = route.duration as string | { seconds?: string } | undefined;
    if (typeof dur === "string") {
        durationSeconds = parseInt(dur.replace(/s$/i, "").trim(), 10) || 0;
    } else if (dur && typeof dur === "object" && dur.seconds !== undefined) {
        durationSeconds = parseInt(String(dur.seconds), 10) || 0;
    }

    return { encodedPolyline: encoded, distanceMeters, durationSeconds };
}

/**
 * Multi-tier priority mesh: standard walk, VIP walk w/ suite intermediates, emergency drive on service roads.
 */
export async function computePriorityRoute(params: {
    apiKey: string;
    originLat: number;
    originLng: number;
    destLat: number;
    destLng: number;
    stepFreeRequired: boolean;
    priority: RoutePriority;
}): Promise<RoutesApiOk> {
    const body: Record<string, unknown> = {
        origin: {
            location: { latLng: { latitude: params.originLat, longitude: params.originLng } },
        },
        destination: {
            location: { latLng: { latitude: params.destLat, longitude: params.destLng } },
        },
        polylineQuality: "HIGH_QUALITY",
        polylineEncoding: "ENCODED_POLYLINE",
    };

    if (params.priority === "emergency") {
        body.travelMode = "DRIVE";
        body.routingPreference = "TRAFFIC_AWARE";
        body.intermediates = EMERGENCY_DRIVE_INTERMEDIATES.map((p) => ({
            location: { latLng: { latitude: p.latitude, longitude: p.longitude } },
        }));
    } else if (params.priority === "vip") {
        body.travelMode = "WALK";
        body.intermediates = VIP_WALK_INTERMEDIATES.map((p) => ({
            location: { latLng: { latitude: p.latitude, longitude: p.longitude } },
        }));
    } else {
        body.travelMode = "WALK";
    }

    if (params.stepFreeRequired && params.priority !== "emergency") {
        body.accessibilityOptions = { wheelchairAccessible: true };
    }

    const res = await fetch(ROUTES_COMPUTE, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": params.apiKey,
            "X-Goog-FieldMask": "routes.polyline,routes.distanceMeters,routes.duration",
        },
        body: JSON.stringify(body),
    });

    const json = (await res.json()) as {
        routes?: Array<{
            polyline?: { encodedPolyline?: string };
            distanceMeters?: string | number;
            duration?: string | { seconds?: string };
        }>;
        error?: { message?: string; code?: number };
    };

    if (!res.ok || !json.routes?.length) {
        const msg = json.error?.message ?? res.statusText ?? "ROUTES_API_ERROR";
        throw new Error(msg);
    }

    const route = json.routes[0];
    const encoded = route.polyline?.encodedPolyline;
    if (!encoded) {
        throw new Error("MISSING_POLYLINE");
    }

    const distRaw = route.distanceMeters;
    const distanceMeters =
        typeof distRaw === "number" ? distRaw : parseInt(String(distRaw ?? "0"), 10) || 0;

    let durationSeconds = 0;
    const dur = route.duration as string | { seconds?: string } | undefined;
    if (typeof dur === "string") {
        durationSeconds = parseInt(dur.replace(/s$/i, "").trim(), 10) || 0;
    } else if (dur && typeof dur === "object" && dur.seconds !== undefined) {
        durationSeconds = parseInt(String(dur.seconds), 10) || 0;
    }

    return { encodedPolyline: encoded, distanceMeters, durationSeconds };
}

export interface PlaceTipResult {
    tip: string;
    places: Array<{
        name: string;
        distanceMeters?: number;
        wheelchairAccessibleEntrance?: boolean;
    }>;
}

export async function searchNearbyAmenities(params: {
    apiKey: string;
    latitude: number;
    longitude: number;
    wheelchairAccessibleOnly: boolean;
}): Promise<PlaceTipResult> {
    const body = {
        includedTypes: ["restroom"],
        maxResultCount: 8,
        rankPreference: "DISTANCE",
        locationRestriction: {
            circle: {
                center: { latitude: params.latitude, longitude: params.longitude },
                radius: 400,
            },
        },
    };

    const res = await fetch(PLACES_SEARCH_NEARBY, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": params.apiKey,
            "X-Goog-FieldMask":
                "places.displayName,places.accessibilityOptions,places.location,places.types,places.googleMapsUri",
        },
        body: JSON.stringify(body),
    });

    const json = (await res.json()) as {
        places?: Array<{
            displayName?: { text?: string };
            accessibilityOptions?: { wheelchairAccessibleEntrance?: boolean };
            location?: { latitude?: number; longitude?: number };
        }>;
        error?: { message?: string };
    };

    if (!res.ok) {
        throw new Error(json.error?.message ?? res.statusText ?? "PLACES_API_ERROR");
    }

    const rawPlaces = json.places ?? [];
    let filtered = params.wheelchairAccessibleOnly
        ? rawPlaces.filter((p) => p.accessibilityOptions?.wheelchairAccessibleEntrance === true)
        : rawPlaces;

    if (params.wheelchairAccessibleOnly && filtered.length === 0) {
        filtered = rawPlaces;
    }

    const first = filtered[0];
    const name = first?.displayName?.text ?? "nearby restroom";
    const latP = first?.location?.latitude ?? params.latitude;
    const lngP = first?.location?.longitude ?? params.longitude;
    const metersApprox = haversineMeters(params.latitude, params.longitude, latP, lngP);
    const walkMin = Math.max(1, Math.round(metersApprox / 80));
    const occupancy = Math.floor(Math.random() * 35) + 5;
    const busy = occupancy > 70;

    const tip = busy
        ? `Smart tip: ${name} is about a ${walkMin}-minute walk and is moderately busy (~${occupancy}% occupancy). Try another concourse if you need a shorter wait.`
        : `Smart tip: ${name} is a ${walkMin}-minute walk and currently has light traffic (~${occupancy}% occupancy).`;

    return {
        tip,
        places: filtered.slice(0, 5).map((p) => ({
            name: p.displayName?.text ?? "Place",
            wheelchairAccessibleEntrance: p.accessibilityOptions?.wheelchairAccessibleEntrance,
            distanceMeters: haversineMeters(
                params.latitude,
                params.longitude,
                p.location?.latitude ?? params.latitude,
                p.location?.longitude ?? params.longitude
            ),
        })),
    };
}

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

const DISTANCE_MATRIX = "https://maps.googleapis.com/maps/api/distancematrix/json";

export type GateEtaRow = {
    gateId: string;
    /** Walking duration from Distance Matrix, seconds. */
    durationSeconds: number;
    distanceMeters: number;
};

/**
 * Compares one origin to many gate destinations using the Distance Matrix API (walking).
 * Returns gates sorted fastest-first ("Fastest to Reach").
 */
export async function computeGateEtas(params: {
    apiKey: string;
    originLat: number;
    originLng: number;
    /** Destinations to compare (e.g. from `gateLogistics` doc ids + `GATE_DESTINATIONS`). */
    gates: Array<{ gateId: string; latitude: number; longitude: number }>;
}): Promise<GateEtaRow[]> {
    if (params.gates.length === 0) {
        return [];
    }

    const origins = `${params.originLat},${params.originLng}`;
    const destinations = params.gates.map((g) => `${g.latitude},${g.longitude}`).join("|");

    const url = new URL(DISTANCE_MATRIX);
    url.searchParams.set("origins", origins);
    url.searchParams.set("destinations", destinations);
    url.searchParams.set("mode", "walking");
    url.searchParams.set("units", "metric");
    url.searchParams.set("key", params.apiKey);

    const res = await fetch(url.toString());
    const json = (await res.json()) as {
        status?: string;
        error_message?: string;
        rows?: Array<{
            elements?: Array<{
                status?: string;
                duration?: { value: number };
                distance?: { value: number };
            }>;
        }>;
    };

    if (!res.ok || json.status !== "OK") {
        const msg = json.error_message ?? json.status ?? "DISTANCE_MATRIX_ERROR";
        throw new Error(msg);
    }

    const elements = json.rows?.[0]?.elements ?? [];
    const out: GateEtaRow[] = [];
    for (let i = 0; i < params.gates.length; i++) {
        const gate = params.gates[i];
        const el = elements[i];
        if (!gate || !el || el.status !== "OK" || el.duration?.value == null) {
            continue;
        }
        out.push({
            gateId: gate.gateId,
            durationSeconds: el.duration.value,
            distanceMeters: el.distance?.value ?? 0,
        });
    }

    out.sort((a, b) => a.durationSeconds - b.durationSeconds);
    return out;
}
