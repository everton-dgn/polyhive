import * as ExpoCrypto from "expo-crypto";
import { Buffer } from "buffer";

declare global {
  interface Crypto {
    randomUUID(): `${string}-${string}-${string}-${string}-${string}`;
  }
}

type RandomUUID = `${string}-${string}-${string}-${string}-${string}`;
type FillRandomValues = <T extends ArrayBufferView | null>(array: T) => T;

function createUuidV4(fillRandomValues: FillRandomValues): RandomUUID {
  const bytes = fillRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;

  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"));
  return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex
    .slice(6, 8)
    .join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10, 16).join("")}` as RandomUUID;
}

export function polyfillCrypto(): void {
  const nativeGetRandomValues =
    typeof (globalThis as any).crypto?.getRandomValues === "function"
      ? (globalThis as any).crypto.getRandomValues.bind((globalThis as any).crypto)
      : null;

  // Ensure TextEncoder/TextDecoder exist for shared E2EE code (tweetnacl + relay transport).
  // Hermes may not provide them in all configurations.
  if (typeof (globalThis as any).TextEncoder !== "function") {
    class BufferTextEncoder {
      encode(input = ""): Uint8Array {
        return Uint8Array.from(Buffer.from(String(input), "utf8"));
      }
    }
    (globalThis as any).TextEncoder = BufferTextEncoder as any;
  }

  if (typeof (globalThis as any).TextDecoder !== "function") {
    class BufferTextDecoder {
      constructor(_label?: string, _options?: unknown) {
        // no-op
      }
      decode(input?: ArrayBuffer | ArrayBufferView): string {
        if (input == null) return "";
        if (input instanceof ArrayBuffer) {
          return Buffer.from(input).toString("utf8");
        }
        if (ArrayBuffer.isView(input)) {
          return Buffer.from(input.buffer, input.byteOffset, input.byteLength).toString("utf8");
        }
        return Buffer.from(String(input), "utf8").toString("utf8");
      }
    }
    (globalThis as any).TextDecoder = BufferTextDecoder as any;
  }

  const existing = (globalThis as any).crypto as Crypto | null | undefined;
  let target = existing;
  if (!target) {
    target = {} as Crypto;
    (globalThis as any).crypto = target;
  }

  const fillRandomValues: FillRandomValues = <T extends ArrayBufferView | null>(array: T): T => {
    if (array === null) return array;
    if (nativeGetRandomValues) {
      return nativeGetRandomValues(array) as T;
    }
    return ExpoCrypto.getRandomValues(array as any) as T;
  };

  if (typeof (globalThis as any).crypto?.randomUUID !== "function") {
    if (!globalThis.crypto) {
      (globalThis as any).crypto = {} as Crypto;
    }
    globalThis.crypto.randomUUID = () => createUuidV4(fillRandomValues);
  }

  if (typeof (globalThis as any).crypto?.getRandomValues !== "function") {
    if (!globalThis.crypto) {
      (globalThis as any).crypto = {} as Crypto;
    }
    globalThis.crypto.getRandomValues = fillRandomValues as Crypto["getRandomValues"];
  }
}
