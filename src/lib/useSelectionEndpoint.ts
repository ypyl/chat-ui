import { useState, useEffect } from "react";

type Point = { x: number; y: number };

type UseSelectionEndpointOptions = {
  ignoreSelector?: string;
  containerRef?: React.RefObject<HTMLElement | null>;
  enabled?: boolean;
};

export function useSelectionEndpoint(options: UseSelectionEndpointOptions = {}): Point | null {
  const { enabled = true } = options;
  const [endpoint, setEndpoint] = useState<Point | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const handleMouseUp = () => {
      setTimeout(() => {
        const selection = window.getSelection();
        if (selection && !selection.isCollapsed) {
          if (options.containerRef?.current) {
            const { anchorNode, focusNode } = selection;
            const container = options.containerRef.current;
            if (!container.contains(anchorNode) || !container.contains(focusNode)) {
              setEndpoint(null);
              return;
            }
          }
          const range = selection.getRangeAt(0);
          const clientRects = range.getClientRects();
          
          if (clientRects.length === 0) {
            setEndpoint(null);
            return;
          }

          let maxBottom = -Infinity;
          let targetRect: DOMRect | null = null;

          for (let i = 0; i < clientRects.length; i++) {
            const rect = clientRects[i];
            if (rect.bottom > maxBottom) {
              maxBottom = rect.bottom;
              targetRect = rect;
            }
          }

          if (targetRect) {
            setEndpoint({ x: targetRect.right, y: targetRect.bottom });
          } else {
            setEndpoint(null);
          }
        } else {
          setEndpoint(null);
        }
      }, 10);
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (options.ignoreSelector && e.target instanceof Element && e.target.closest(options.ignoreSelector)) {
        return;
      }
      setEndpoint(null);
    };

    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mousedown", handleMouseDown);

    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, [enabled, options.ignoreSelector, options.containerRef]);

  return endpoint;
}