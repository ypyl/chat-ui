import { useEffect, useState } from "react";

type Point = { x: number; y: number };

type Options = {
  angle: number; // radians
  margin: number; // px
  clampToViewport?: boolean;
};

export const DIRECTIONS = {
  top: -Math.PI / 2,
  right: 0,
  bottom: Math.PI / 2,
  left: Math.PI,
};

/*
Known limitations (real ones)
1. Gaps between lines

Ray may exit through whitespace → still correct mathematically
If undesired → you need rect merging by line

2. Selection inside scrollable container

You must subtract container offset instead of using window.scrollX/Y

3. RTL / vertical text

Direction logic must adapt
*/

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

      let basePoint = findExitPoint(cleanRects, origin, dir);

      if (!basePoint) {
        basePoint = findDirectionalClosest(cleanRects, origin, dir);
      }

      if (!basePoint) {
        setAnchor({
          x: origin.x + window.scrollX,
          y: origin.y + window.scrollY,
        });
        return;
      }

      let x = basePoint.x + dir.x * margin;
      let y = basePoint.y + dir.y * margin;

      x += window.scrollX;
      y += window.scrollY;

      if (clampToViewport) {
        x = clamp(x, window.scrollX, window.scrollX + window.innerWidth);
        y = clamp(y, window.scrollY, window.scrollY + window.innerHeight);
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

function dedupeRects(rects: DOMRect[]) {
  const map = new Map<string, DOMRect>();

  for (const r of rects) {
    const key = `${r.left}-${r.top}-${r.width}-${r.height}`;
    map.set(key, r);
  }

  return Array.from(map.values());
}

function getBoundingCenter(rects: DOMRect[]) {
  const minX = Math.min(...rects.map((r) => r.left));
  const maxX = Math.max(...rects.map((r) => r.right));
  const minY = Math.min(...rects.map((r) => r.top));
  const maxY = Math.max(...rects.map((r) => r.bottom));

  return {
    x: (minX + maxX) / 2,
    y: (minY + maxY) / 2,
  };
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function rayRectIntersection(origin: Point, dir: Point, rect: DOMRect) {
  const safeDiv = (a: number, b: number) => (b === 0 ? (a > 0 ? Infinity : -Infinity) : a / b);

  const t1 = safeDiv(rect.left - origin.x, dir.x);
  const t2 = safeDiv(rect.right - origin.x, dir.x);
  const t3 = safeDiv(rect.top - origin.y, dir.y);
  const t4 = safeDiv(rect.bottom - origin.y, dir.y);

  const tmin = Math.max(Math.min(t1, t2), Math.min(t3, t4));

  const tmax = Math.min(Math.max(t1, t2), Math.max(t3, t4));

  if (tmax < 0) return null;
  if (tmin > tmax) return null;

  return {
    enter: tmin,
    exit: tmax,
  };
}

function rayHitsRectBand(origin: Point, dir: Point, rect: DOMRect) {
  // horizontal dominant ray
  if (Math.abs(dir.x) > Math.abs(dir.y)) {
    return origin.y >= rect.top && origin.y <= rect.bottom;
  }

  // vertical dominant ray
  return origin.x >= rect.left && origin.x <= rect.right;
}

function findExitPoint(rects: DOMRect[], origin: Point, dir: Point) {
  let maxExit = -Infinity;

  for (const r of rects) {
    if (!rayHitsRectBand(origin, dir, r)) continue;

    const hit = rayRectIntersection(origin, dir, r);
    if (!hit) continue;

    if (hit.exit > maxExit) {
      maxExit = hit.exit;
    }
  }

  if (maxExit === -Infinity) return null;

  return {
    x: origin.x + dir.x * maxExit,
    y: origin.y + dir.y * maxExit,
  };
}

function projectPointToRectAlongDir(origin: Point, dir: Point, rect: DOMRect) {
  // Horizontal ray
  if (Math.abs(dir.x) > Math.abs(dir.y)) {
    const y = clamp(origin.y, rect.top, rect.bottom);

    if (dir.x > 0) {
      // looking right → use left edge
      return {
        x: rect.left,
        y,
      };
    } else {
      // looking left → use right edge
      return {
        x: rect.right,
        y,
      };
    }
  }

  // Vertical ray
  const x = clamp(origin.x, rect.left, rect.right);

  if (dir.y > 0) {
    // looking down → top edge
    return {
      x,
      y: rect.top,
    };
  } else {
    // looking up → bottom edge
    return {
      x,
      y: rect.bottom,
    };
  }
}

function findDirectionalClosest(rects: DOMRect[], origin: Point, dir: Point) {
  let best = null;
  let bestDist = Infinity;

  for (const r of rects) {
    const p = projectPointToRectAlongDir(origin, dir, r);

    const dx = p.x - origin.x;
    const dy = p.y - origin.y;

    const t = dx * dir.x + dy * dir.y; // projection length

    if (t <= 0) continue; // wrong direction

    if (t < bestDist) {
      bestDist = t;
      best = p;
    }
  }

  return best;
}
