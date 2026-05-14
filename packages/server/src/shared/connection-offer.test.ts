import { describe, expect, test } from "vitest";

import { ConnectionOfferV2Schema } from "./connection-offer.js";

describe("ConnectionOfferV2Schema relay TLS", () => {
  test("leaves relay TLS unset when absent", () => {
    expect(
      ConnectionOfferV2Schema.parse({
        v: 2,
        serverId: "server-123",
        daemonPublicKeyB64: "pubkey",
        relay: { endpoint: "relay.example.com:80" },
      }),
    ).toEqual({
      v: 2,
      serverId: "server-123",
      daemonPublicKeyB64: "pubkey",
      relay: { endpoint: "relay.example.com:80" },
    });
  });

  test("preserves explicit relay TLS", () => {
    expect(
      ConnectionOfferV2Schema.parse({
        v: 2,
        serverId: "server-123",
        daemonPublicKeyB64: "pubkey",
        relay: { endpoint: "relay.example.com:443", useTls: true },
      }),
    ).toEqual({
      v: 2,
      serverId: "server-123",
      daemonPublicKeyB64: "pubkey",
      relay: { endpoint: "relay.example.com:443", useTls: true },
    });
  });

  test("strips unknown relay fields instead of rejecting (forward-compat)", () => {
    expect(
      ConnectionOfferV2Schema.parse({
        v: 2,
        serverId: "server-123",
        daemonPublicKeyB64: "pubkey",
        relay: { endpoint: "relay.example.com:443", useTls: true, extra: "future" },
      }),
    ).toEqual({
      v: 2,
      serverId: "server-123",
      daemonPublicKeyB64: "pubkey",
      relay: { endpoint: "relay.example.com:443", useTls: true },
    });
  });
});
