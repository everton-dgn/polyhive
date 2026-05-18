import { Buffer } from "buffer";

import { describe, expect, test } from "vitest";

import {
  ConnectionOfferV2Schema,
  decodeOfferFragmentPayload,
  parseConnectionOfferFromUrl,
  type ConnectionOffer,
} from "./connection-offer.js";

function encodeOfferAsUrl(offer: ConnectionOffer, appBaseUrl = "https://app.polyhive.sh"): string {
  const payload = Buffer.from(JSON.stringify(offer), "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return `${appBaseUrl}/#offer=${payload}`;
}

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

describe("parseConnectionOfferFromUrl", () => {
  const validOffer: ConnectionOffer = {
    v: 2,
    serverId: "server-123",
    daemonPublicKeyB64: "pubkey",
    relay: { endpoint: "relay.example.com:443", useTls: true },
  };

  test("returns null when input has no offer fragment", () => {
    expect(parseConnectionOfferFromUrl("https://app.polyhive.sh/")).toBeNull();
    expect(parseConnectionOfferFromUrl("localhost:6768")).toBeNull();
    expect(parseConnectionOfferFromUrl("tcp://host:6768?ssl=true")).toBeNull();
    expect(parseConnectionOfferFromUrl("")).toBeNull();
  });

  test("parses a valid offer URL with #offer=<base64url> fragment", () => {
    const url = encodeOfferAsUrl(validOffer);
    expect(parseConnectionOfferFromUrl(url)).toEqual(validOffer);
  });

  test("throws when fragment payload is malformed JSON", () => {
    const malformed = "https://app.polyhive.sh/#offer=not-base64-encoded-json";
    expect(() => parseConnectionOfferFromUrl(malformed)).toThrow();
  });

  test("throws when fragment payload fails schema validation", () => {
    const invalidPayload = Buffer.from(JSON.stringify({ v: 99, foo: "bar" }), "utf8")
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    const url = `https://app.polyhive.sh/#offer=${invalidPayload}`;
    expect(() => parseConnectionOfferFromUrl(url)).toThrow();
  });
});

describe("decodeOfferFragmentPayload", () => {
  test("decodes a base64url-encoded JSON payload", () => {
    const payload = { v: 2, serverId: "x", daemonPublicKeyB64: "k", relay: { endpoint: "e:443" } };
    const encoded = Buffer.from(JSON.stringify(payload), "utf8")
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    expect(decodeOfferFragmentPayload(encoded)).toEqual(payload);
  });
});
