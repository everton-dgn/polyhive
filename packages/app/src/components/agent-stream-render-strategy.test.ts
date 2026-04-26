import { describe, expect, it } from "vitest";
import type { StreamItem } from "@/types/stream";
import {
  collectAssistantTurnContentForStreamRenderStrategy,
  getBottomOffsetForStreamRenderStrategy,
  getStreamEdgeSlotProps,
  getStreamNeighborIndex,
  getStreamNeighborItem,
  isNearBottomForStreamRenderStrategy,
  orderHeadForStreamRenderStrategy,
  orderTailForStreamRenderStrategy,
  resolveStreamRenderStrategy,
} from "./agent-stream-render-strategy";

function createTimestamp(seed: number): Date {
  return new Date(`2026-01-01T00:00:0${seed}.000Z`);
}

function userMessage(id: string, text: string, seed: number): StreamItem {
  return {
    kind: "user_message",
    id,
    text,
    timestamp: createTimestamp(seed),
  };
}

function assistantMessage(id: string, text: string, seed: number): StreamItem {
  return {
    kind: "assistant_message",
    id,
    text,
    timestamp: createTimestamp(seed),
  };
}

describe("stream ordering", () => {
  const streamItems: StreamItem[] = [
    userMessage("u1", "user-1", 1),
    assistantMessage("a1", "assistant-1", 2),
    assistantMessage("a2", "assistant-2", 3),
  ];

  it("keeps forward_stream order unchanged for tail and head", () => {
    const strategy = resolveStreamRenderStrategy({
      isMobileBreakpoint: false,
    });

    const tail = orderTailForStreamRenderStrategy({ strategy, streamItems });
    const head = orderHeadForStreamRenderStrategy({ strategy, streamHead: streamItems });

    expect(tail.map((item) => item.id)).toEqual(["u1", "a1", "a2"]);
    expect(head.map((item) => item.id)).toEqual(["u1", "a1", "a2"]);
  });
});

describe("neighbor and traversal semantics", () => {
  it("maps above/below indices for forward streams", () => {
    const forward = resolveStreamRenderStrategy({
      isMobileBreakpoint: false,
    });

    expect(getStreamNeighborIndex({ strategy: forward, index: 3, relation: "above" })).toBe(2);
    expect(getStreamNeighborIndex({ strategy: forward, index: 3, relation: "below" })).toBe(4);
  });

  it("collects assistant turn content with strategy traversal direction", () => {
    const chronological: StreamItem[] = [
      userMessage("u1", "user-1", 1),
      assistantMessage("a1", "assistant-1", 2),
      assistantMessage("a2", "assistant-2", 3),
      userMessage("u2", "user-2", 4),
    ];

    const forward = resolveStreamRenderStrategy({
      isMobileBreakpoint: false,
    });
    const forwardStartIndex = chronological.findIndex((item) => item.id === "a2");
    expect(
      collectAssistantTurnContentForStreamRenderStrategy({
        strategy: forward,
        items: chronological,
        startIndex: forwardStartIndex,
      }),
    ).toBe("assistant-1\n\nassistant-2");
  });

  it("returns undefined neighbor when index would be out of bounds", () => {
    const forward = resolveStreamRenderStrategy({
      isMobileBreakpoint: false,
    });
    const items: StreamItem[] = [userMessage("u1", "user-1", 1)];

    expect(
      getStreamNeighborItem({
        strategy: forward,
        items,
        index: 0,
        relation: "above",
      }),
    ).toBeUndefined();
    expect(
      getStreamNeighborItem({
        strategy: forward,
        items,
        index: 0,
        relation: "below",
      }),
    ).toBeUndefined();
  });
});

describe("scroll/bottom calculations", () => {
  it("computes near-bottom using forward_stream distance-from-bottom math", () => {
    const strategy = resolveStreamRenderStrategy({
      isMobileBreakpoint: false,
    });

    expect(
      isNearBottomForStreamRenderStrategy({
        strategy,
        offsetY: 680,
        viewportHeight: 300,
        contentHeight: 1000,
        threshold: 24,
      }),
    ).toBe(true);
    expect(
      isNearBottomForStreamRenderStrategy({
        strategy,
        offsetY: 600,
        viewportHeight: 300,
        contentHeight: 1000,
        threshold: 24,
      }),
    ).toBe(false);
  });
  it("maps scroll-to-bottom to max offset for forward_stream", () => {
    const strategy = resolveStreamRenderStrategy({
      isMobileBreakpoint: false,
    });

    expect(
      getBottomOffsetForStreamRenderStrategy({
        strategy,
        viewportHeight: 320,
        contentHeight: 1000,
      }),
    ).toBe(680);
  });
});

describe("edge slot semantics", () => {
  it("uses footer slot for forward_stream", () => {
    const EdgeSlot = () => null;
    const forward = resolveStreamRenderStrategy({
      isMobileBreakpoint: false,
    });

    const forwardProps = getStreamEdgeSlotProps({
      strategy: forward,
      component: EdgeSlot,
      gapSize: 4,
    });
    expect(forwardProps).toEqual({
      ListFooterComponent: EdgeSlot,
      ListFooterComponentStyle: { marginTop: 4 },
    });
  });
});
