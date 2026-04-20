export const BLE_SERVICES = {
    ENTRY_NODE: 0x181A // Simulating Environmental Sensing for gate beacons
};

/** Human-readable reason when Web Bluetooth cannot be used, or null if the API exists. */
export function getWebBluetoothBlockReason(): string | null {
    if (typeof navigator === 'undefined') {
        return 'Bluetooth is not available in this environment.';
    }
    const nav = navigator as Navigator & { bluetooth?: unknown };
    if (!nav.bluetooth) {
        return 'Web Bluetooth is not available here. Use Chrome (desktop or Android), ensure HTTPS, and grant Bluetooth permission when prompted.';
    }
    return null;
}

/**
 * Edge Proxy: BLE Beacon Proximity Matcher
 * Triggers dispatch notifications seamlessly during 0kbps offline states.
 */
type NavigatorWithBluetooth = Navigator & {
    bluetooth?: { requestDevice: (opts: { filters: { services: number[] }[] }) => Promise<{ id: string }> };
};

export const detectBeaconProximity = async (onDetected: (deviceId: string) => void) => {
    try {
        const _nav = navigator as NavigatorWithBluetooth;

        if (!_nav.bluetooth) {
            console.warn("Web Bluetooth API not supported on this physical terminal.");
            throw new Error(getWebBluetoothBlockReason() ?? 'Web Bluetooth unavailable');
        }

        const device = await _nav.bluetooth.requestDevice({
            filters: [{ services: [BLE_SERVICES.ENTRY_NODE] }]
        });

        if (device) {
            if (import.meta.env.DEV) {
                console.info(`[Edge Hardware] Extracted offline ping from Beacon: ${device.id}`);
            }
            onDetected(device.id);

            // Optional: Native browser push notification if required to break UX shell
            if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
                try {
                    new Notification('Reroute Required', {
                        body: 'Gate congestion ahead. Routing you to Alternate B.',
                        icon: '/favicon.svg'
                    });
                } catch {
                    /* ignore — jsdom / restricted environments */
                }
            }
        }
    } catch (e) {
        if (import.meta.env.DEV) {
            console.error("BLE Scanning interruption:", e);
        }
        throw e instanceof Error ? e : new Error('Bluetooth scan was cancelled or failed.');
    }
};
