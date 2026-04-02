import { useState, useEffect } from "react";

export function useSelectionRects() {
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

    const handleMouseDown = () => {
      setRects([]);
    };

    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mousedown", handleMouseDown);

    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, []);

  return rects;
}
