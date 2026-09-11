import { Capacitor } from "@capacitor/core";

export type HapticStyle = "light" | "medium" | "heavy";

/** 네이티브 앱에서만 동작. 웹에서는 조용히 무시. */
export async function hapticImpact(style: HapticStyle = "light") {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
    const map: Record<HapticStyle, import("@capacitor/haptics").ImpactStyle> = {
      light: ImpactStyle.Light,
      medium: ImpactStyle.Medium,
      heavy: ImpactStyle.Heavy,
    };
    await Haptics.impact({ style: map[style] });
  } catch {
    // 햅틱 미지원 기기 등은 무시
  }
}
