import { describe, expect, it } from "vitest";
import { createNormalizedRegionBox, pointToNormalizedBoxPoint, regionBoxToStyle } from "./region-workspace";

const rect = {
  left: 100,
  top: 50,
  width: 400,
  height: 200
};

describe("region workspace helpers", () => {
  it("converts pointer positions into normalized page coordinates", () => {
    expect(pointToNormalizedBoxPoint({ clientX: 300, clientY: 150 }, rect)).toEqual({
      x: 0.5,
      y: 0.5
    });

    expect(pointToNormalizedBoxPoint({ clientX: 40, clientY: 280 }, rect)).toEqual({
      x: 0,
      y: 1
    });
  });

  it("creates normalized rectangles regardless of drag direction", () => {
    expect(
      createNormalizedRegionBox(
        { clientX: 420, clientY: 210 },
        { clientX: 180, clientY: 90 },
        rect
      )
    ).toEqual({
      x: 0.2,
      y: 0.2,
      width: 0.6,
      height: 0.6
    });
  });

  it("rejects selections that are too small and maps boxes to CSS percentages", () => {
    expect(
      createNormalizedRegionBox(
        { clientX: 100, clientY: 50 },
        { clientX: 101, clientY: 51 },
        rect
      )
    ).toBeNull();

    expect(regionBoxToStyle({ x: 0.1, y: 0.2, width: 0.3, height: 0.4 })).toEqual({
      left: "10%",
      top: "20%",
      width: "30%",
      height: "40%"
    });
  });
});
