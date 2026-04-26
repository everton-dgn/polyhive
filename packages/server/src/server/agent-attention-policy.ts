export const PRESENCE_THRESHOLD_MS = 180_000;

export interface ClientPresenceState {
  lastActivityAtMs: number | null;
  focusedAgentId: string | null;
}

export interface NotificationPlan {
  inAppRecipientIndex: number | null;
}

type ComputeNotificationPlanInput = {
  allStates: ClientPresenceState[];
  agentId: string;
  nowMs: number;
};

export function computeNotificationPlan({
  allStates,
  agentId,
  nowMs,
}: ComputeNotificationPlanInput): NotificationPlan {
  let mostRecentPresentIndex: number | null = null;
  let mostRecentPresentAtMs = Number.NEGATIVE_INFINITY;

  for (const [clientIndex, state] of allStates.entries()) {
    const clampedActivityAtMs =
      state.lastActivityAtMs === null ? null : Math.min(state.lastActivityAtMs, nowMs);
    const isPresent =
      clampedActivityAtMs !== null && nowMs - clampedActivityAtMs <= PRESENCE_THRESHOLD_MS;

    if (!isPresent) {
      continue;
    }

    if (state.focusedAgentId === agentId) {
      return { inAppRecipientIndex: null };
    }

    if (clampedActivityAtMs > mostRecentPresentAtMs) {
      mostRecentPresentIndex = clientIndex;
      mostRecentPresentAtMs = clampedActivityAtMs;
    }
  }

  return { inAppRecipientIndex: mostRecentPresentIndex };
}
