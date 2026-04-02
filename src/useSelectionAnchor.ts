import { useEffect, useState } from "react";

type Point = { x: number; y: number };

type Options = {
  angle: number;     // radians
  margin: number;    // px
  clampToViewport?: boolean;
};

export function useSelectionAnchor(options: Options) {
  const { angle, margin, clampToViewport = true } = options;

  const [anchor, setAnchor] = useState<Point | null>(null);

  useEffect(() => {
    function update() {
      const selection = window.getSelection();

      if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
        setAnchor(null);
        return;
      }

      const range = selection.getRangeAt(0);
      const rects = Array.from(range.getClientRects());

      if (rects.length === 0) {
        setAnchor(null);
        return;
      }

      const cleanRects = dedupeRects(rects);

      const origin = getBoundingCenter(cleanRects);

      const dir = {
        x: Math.cos(angle),
        y: Math.sin(angle),
      };

      const exit = findExitPoint(cleanRects, origin, dir);

      if (!exit) {
        setAnchor(origin);
        return;
      }

      let x = exit.x + dir.x * margin;
      let y = exit.y + dir.y * margin;

      // account for scroll (client → page coords)
      x += window.scrollX;
      y += window.scrollY;

      if (clampToViewport) {
        x = Math.max(window.scrollX, Math.min(window.scrollX + window.innerWidth, x));
        y = Math.max(window.scrollY, Math.min(window.scrollY + window.innerHeight, y));
      }

      setAnchor({ x, y });
    }

    update();

    document.addEventListener("selectionchange", update);
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    return () => {
      document.removeEventListener("selectionchange", update);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [angle, margin, clampToViewport]);

  return anchor;
}
