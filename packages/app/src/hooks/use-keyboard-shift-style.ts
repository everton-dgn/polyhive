import { useEffect } from "react";
import type { ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useReanimatedKeyboardAnimation } from "react-native-keyboard-controller";
import {
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  type SharedValue,
} from "react-native-reanimated";

function resolveKeyboardShift(input: {
  rawKeyboardHeight: number;
  bottomInset: number;
  enabled: boolean;
}): number {
  "worklet";

  if (!input.enabled) {
    return 0;
  }

  return Math.max(0, input.rawKeyboardHeight - input.bottomInset);
}

type KeyboardShiftMode = "translate" | "padding";

export function useKeyboardShiftStyle(input: { mode: KeyboardShiftMode; enabled?: boolean }): {
  shift: SharedValue<number>;
  style: ReturnType<typeof useAnimatedStyle<ViewStyle>>;
} {
  const insets = useSafeAreaInsets();
  const { height: keyboardHeight } = useReanimatedKeyboardAnimation();
  const bottomInset = useSharedValue(insets.bottom);
  const enabled = input.enabled ?? true;

  useEffect(() => {
    bottomInset.value = insets.bottom;
  }, [bottomInset, insets.bottom]);

  const shift = useDerivedValue(() => {
    "worklet";
    const rawKeyboardHeight = Math.abs(keyboardHeight.value);
    return resolveKeyboardShift({
      rawKeyboardHeight,
      bottomInset: bottomInset.value,
      enabled,
    });
  });

  const style = useAnimatedStyle<ViewStyle>(() => {
    "worklet";
    if (input.mode === "padding") {
      if (!enabled) {
        return { paddingBottom: 0 };
      }
      // Include safe-area bottom inset so content clears the home indicator even without a keyboard.
      return { paddingBottom: bottomInset.value + shift.value };
    }

    return { transform: [{ translateY: -shift.value }] };
  }, [input.mode]);

  return { shift, style };
}
