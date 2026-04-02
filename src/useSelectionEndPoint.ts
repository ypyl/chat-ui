type Point = { x: number; y: number };

export function useSelectionEndPoint(rects: DOMRectList | DOMRect[]): Point | null {
  if (rects.length === 0) {
    return null;
  }

  let maxBottom = -Infinity;
  let targetRect: DOMRect | null = null;

  for (let i = 0; i < rects.length; i++) {
    const rect = rects[i];
    if (rect.bottom > maxBottom) {
      maxBottom = rect.bottom;
      targetRect = rect;
    }
  }

  if (!targetRect) {
    return null;
  }

  return {
    x: targetRect.right,
    y: targetRect.bottom,
  };
}
