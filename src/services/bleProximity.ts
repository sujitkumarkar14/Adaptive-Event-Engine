export const BLE_SERVICES = {
    ENTRY_NODE: 0x181A // Simulating Environmental Sensing for gate beacons
};

/**
 * Edge Proxy: BLE Beacon Proximity Matcher
 * Triggers dispatch notifications seamlessly during 0kbps offline states.
 */
export const detectBeaconProximity = async (onDetected: (deviceId: string) => void) => {
    try {
        const _nav = navigator as any;

        if (!_nav.bluetooth) {
            console.warn("Web Bluetooth API not supported on this physical terminal.");
            return;
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
            if (Notification.permission === 'granted') {
                new Notification('Reroute Required', {
                    body: 'Gate congestion ahead. Routing you to Alternate B.',
                    icon: '/favicon.svg'
                });
            }
        }
    } catch (e) {
        if (import.meta.env.DEV) {
            console.error("BLE Scanning interruption:", e);
        }
    }
};
