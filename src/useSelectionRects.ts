import { useState, useEffect } from "react";

type UseSelectionRectsOptions = {
  ignoreSelector?: string;
};

export function useSelectionRects(options: UseSelectionRectsOptions = {}) {
  const [rects, setRects] = useState<DOMRect[]>([]);

  useEffect(() => {
    const handleMouseUp = () => {
      setTimeout(() => {
        const selection = window.getSelection();
        if (selection && !selection.isCollapsed) {
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
  }, [options.ignoreSelector]);

  return rects;
}
