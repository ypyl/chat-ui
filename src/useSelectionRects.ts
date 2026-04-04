import React, { useState, useEffect } from "react";

type UseSelectionRectsOptions = {
  ignoreSelector?: string;
  containerRef?: React.RefObject<HTMLElement | null>;
};

export function useSelectionRects(options: UseSelectionRectsOptions = {}) {
  const [rects, setRects] = useState<DOMRect[]>([]);

  useEffect(() => {
    const handleMouseUp = () => {
      setTimeout(() => {
        const selection = window.getSelection();
        if (selection && !selection.isCollapsed) {
          if (options.containerRef?.current) {
            const { anchorNode, focusNode } = selection;
            const container = options.containerRef.current;
            if (!container.contains(anchorNode) || !container.contains(focusNode)) {
              setRects([]);
              return;
            }
          }
          const range = selection.getRangeAt(0);
          const clientRects = range.getClientRects();
          setRects(Array.from(clientRects));
        } else {
          setRects([]);
        }
      }, 10);
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (options.ignoreSelector && e.target instanceof Element && e.target.closest(options.ignoreSelector)) {
        return;
      }
      setRects([]);
    };

    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mousedown", handleMouseDown);

    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, [options.ignoreSelector, options.containerRef]);

  return rects;
}
