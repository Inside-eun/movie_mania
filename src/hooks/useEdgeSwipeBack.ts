import { useEffect, useRef } from "react";

// 화면 왼쪽 끝에서 시작한 스와이프만 뒤로가기로 인식한다. 네이티브 엣지 스와이프 존과 맞춰둔 값.
const EDGE_ZONE_PX = 24;
const TRIGGER_DISTANCE_PX = 80;
const MAX_VERTICAL_DRIFT_PX = 60;

// 실제 라우트 전환 없이 컴포넌트 state로만 화면을 전환하는 뷰(기획전 상세 등)는
// WKWebView의 네이티브 엣지 스와이프 제스처(allowsBackForwardNavigationGestures)가
// 감지할 히스토리 엔트리가 없어 동작하지 않는다. 이 훅은 그런 화면에서 동일한
// 왼쪽 엣지 스와이프 제스처를 JS 레벨에서 감지해 뒤로가기 콜백을 대신 호출한다.
export function useEdgeSwipeBack(onBack: () => void, enabled = true) {
  const onBackRef = useRef(onBack);
  onBackRef.current = onBack;

  useEffect(() => {
    if (!enabled) return;

    let startX = 0;
    let startY = 0;
    let tracking = false;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch || touch.clientX > EDGE_ZONE_PX) {
        tracking = false;
        return;
      }
      startX = touch.clientX;
      startY = touch.clientY;
      tracking = true;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!tracking) return;
      tracking = false;

      const touch = e.changedTouches[0];
      if (!touch) return;

      const deltaX = touch.clientX - startX;
      const deltaY = Math.abs(touch.clientY - startY);
      if (deltaX > TRIGGER_DISTANCE_PX && deltaY < MAX_VERTICAL_DRIFT_PX) {
        onBackRef.current();
      }
    };

    const handleTouchCancel = () => {
      tracking = false;
    };

    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });
    document.addEventListener("touchcancel", handleTouchCancel, { passive: true });
    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchend", handleTouchEnd);
      document.removeEventListener("touchcancel", handleTouchCancel);
    };
  }, [enabled]);
}
