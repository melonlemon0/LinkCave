import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle } from "@capacitor/haptics";

/** Light tap when the user hits paste (+) on native; no-op on web / if unavailable. */
export function hapticPasteTap(): void {
  if (!Capacitor.isNativePlatform()) return;
  void Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {
    /* Simulator or disabled haptics */
  });
}
