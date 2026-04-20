import { beforeEach, describe, expect, it, vi } from "vitest";
import {
    sendCongestionNudgesToTokens,
    sendEmergencyTopicMessage,
    sendSmartRerouteTopicMessage,
} from "./fcmHelpers";

const messagingMocks = vi.hoisted(() => ({
    send: vi.fn(),
    sendEachForMulticast: vi.fn(),
}));

vi.mock("firebase-admin", () => ({
    messaging: () => ({
        send: messagingMocks.send,
        sendEachForMulticast: messagingMocks.sendEachForMulticast,
    }),
    default: {
        messaging: () => ({
            send: messagingMocks.send,
            sendEachForMulticast: messagingMocks.sendEachForMulticast,
        }),
    },
}));

describe("fcmHelpers", () => {
    beforeEach(() => {
        messagingMocks.send.mockReset().mockResolvedValue(undefined);
        messagingMocks.sendEachForMulticast.mockReset().mockResolvedValue({ successCount: 1, failureCount: 0 });
    });

    it("sendEmergencyTopicMessage sends high-priority topic payload", async () => {
        await sendEmergencyTopicMessage({ type: "EVAC", location: "NORTH" });
        expect(messagingMocks.send).toHaveBeenCalledTimes(1);
        const msg = messagingMocks.send.mock.calls[0][0] as { topic: string; data: Record<string, string> };
        expect(msg.topic).toBe("emergency");
        expect(msg.data.kind).toBe("emergency");
        expect(msg.data.type).toBe("EVAC");
        expect(msg.data.location).toBe("NORTH");
    });

    it("sendSmartRerouteTopicMessage uses default body when omitted", async () => {
        await sendSmartRerouteTopicMessage({ source: "staff" });
        expect(messagingMocks.send).toHaveBeenCalled();
        const msg = messagingMocks.send.mock.calls[0][0] as { notification?: { body?: string } };
        expect(msg.notification?.body).toMatch(/Smart Reroute Active/);
    });

    it("sendCongestionNudgesToTokens returns zeros for empty token list", async () => {
        await expect(sendCongestionNudgesToTokens([], "GATE_A")).resolves.toEqual({
            successCount: 0,
            failureCount: 0,
        });
        expect(messagingMocks.sendEachForMulticast).not.toHaveBeenCalled();
    });

    it("sendCongestionNudgesToTokens multicasts for tokens", async () => {
        await sendCongestionNudgesToTokens(["t1", "t2"], "GATE_B", "CODE");
        expect(messagingMocks.sendEachForMulticast).toHaveBeenCalledTimes(1);
        const payload = messagingMocks.sendEachForMulticast.mock.calls[0][0] as {
            tokens: string[];
            data: Record<string, string>;
        };
        expect(payload.tokens).toEqual(["t1", "t2"]);
        expect(payload.data.gateId).toBe("GATE_B");
        expect(payload.data.voucherCode).toBe("CODE");
    });
});
