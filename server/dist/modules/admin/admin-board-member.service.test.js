import { beforeEach, describe, expect, it, vi } from "vitest";
const getUserById = vi.fn();
const upsertBoardMember = vi.fn();
const updateBoardMember = vi.fn();
const clearBoardChairs = vi.fn();
vi.mock("./admin.repository.js", () => ({
    getUserById,
    upsertBoardMember,
    updateBoardMember,
    clearBoardChairs,
}));
const service = await import("./admin.service.js");
describe("admin board member service", () => {
    beforeEach(() => vi.clearAllMocks());
    it("adds only active BOARD users as board members", async () => {
        getUserById.mockResolvedValue({ isActive: true, role: "BOARD" });
        upsertBoardMember.mockResolvedValue({ userId: "board1" });
        await expect(service.addAdminBoardMemberService("board1")).resolves.toMatchObject({ userId: "board1" });
    });
    it("blocks non-BOARD users from becoming board members", async () => {
        getUserById.mockResolvedValue({ isActive: true, role: "EDITOR" });
        await expect(service.addAdminBoardMemberService("editor1")).rejects.toThrow("Board member user must have BOARD role");
    });
    it("assigns chair only to active BOARD users and clears old chairs", async () => {
        getUserById.mockResolvedValue({ isActive: true, role: "BOARD" });
        upsertBoardMember.mockResolvedValue({ userId: { _id: "board1", email: "board@example.com", name: "Board", role: "BOARD", isActive: true } });
        updateBoardMember.mockResolvedValue({ userId: { _id: "board1", email: "board@example.com", name: "Board", role: "BOARD", isActive: true }, isActive: true, isChair: true });
        const result = await service.setAdminBoardChairService("board1");
        expect(clearBoardChairs).toHaveBeenCalledWith("board1");
        expect(result).toMatchObject({ isChair: true });
    });
});
//# sourceMappingURL=admin-board-member.service.test.js.map