import { useState, useEffect } from "react";

/**
 * Loads an HTMLImageElement for use with Konva.Image.
 * Returns [image | null, 'loading' | 'loaded' | 'error'].
 */
export function useKonvaImage(
  src: string,
): [HTMLImageElement | null, "loading" | "loaded" | "error"] {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [status, setStatus] = useState<"loading" | "loaded" | "error">(
    "loading",
  );

  useEffect(() => {
    if (!src) return;
    setStatus("loading");
    setImage(null);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setImage(img);
      setStatus("loaded");
    };
    img.onerror = () => {
      setStatus("error");
    };
    img.src = src;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  return [image, status];
}
