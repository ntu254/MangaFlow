import { describe, expect, it } from "vitest";
import { SERIES_STATUSES } from "../../shared/workflow/status.js";
import { Series } from "./series.model.js";
describe("Series model status enum", () => {
    it("uses the canonical Series status constants", () => {
        const statusPath = Series.schema.path("status");
        expect(statusPath.options.enum).toEqual(SERIES_STATUSES);
    });
});
//# sourceMappingURL=series.model.test.js.map