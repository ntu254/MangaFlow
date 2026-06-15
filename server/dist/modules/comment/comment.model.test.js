import { describe, expect, it } from "vitest";
import { COMMENT_STATUSES } from "../../shared/workflow/status.js";
import { Comment } from "./comment.model.js";
describe("Comment model", () => {
    it("uses canonical comment status enum values", () => {
        const enumValues = Comment.schema.path("status").enumValues;
        expect(enumValues).toEqual([...COMMENT_STATUSES]);
    });
});
//# sourceMappingURL=comment.model.test.js.map