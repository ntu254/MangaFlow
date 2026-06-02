export type NormalizedRegionBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type Point = {
  clientX: number;
  clientY: number;
};

export type RectLike = {
  left: number;
  top: number;
  width: number;
  height: number;
};

function roundRegionValue(value: number) {
  return Math.round(value * 10000) / 10000;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function pointToNormalizedBoxPoint(point: Point, rect: RectLike) {
  return {
    x: clamp((point.clientX - rect.left) / rect.width, 0, 1),
    y: clamp((point.clientY - rect.top) / rect.height, 0, 1)
  };
}

export function createNormalizedRegionBox(
  start: Point,
  end: Point,
  rect: RectLike,
  minSize = 0.01
): NormalizedRegionBox | null {
  if (rect.width <= 0 || rect.height <= 0) return null;

  const from = pointToNormalizedBoxPoint(start, rect);
  const to = pointToNormalizedBoxPoint(end, rect);
  const x = Math.min(from.x, to.x);
  const y = Math.min(from.y, to.y);
  const width = Math.abs(to.x - from.x);
  const height = Math.abs(to.y - from.y);

  if (width < minSize || height < minSize) return null;

  return {
    x: roundRegionValue(x),
    y: roundRegionValue(y),
    width: roundRegionValue(width),
    height: roundRegionValue(height)
  };
}

export function regionBoxToStyle(box: NormalizedRegionBox) {
  return {
    left: `${box.x * 100}%`,
    top: `${box.y * 100}%`,
    width: `${box.width * 100}%`,
    height: `${box.height * 100}%`
  };
}
