import { beforeEach, describe, expect, it, vi } from "vitest";
const listTaskTypes = vi.fn();
const getTaskTypeByName = vi.fn();
const getTaskTypeByCode = vi.fn();
const createTaskType = vi.fn();
const updateTaskType = vi.fn();
const getTaskType = vi.fn();
const taskTypeInUse = vi.fn();
const deleteTaskType = vi.fn();
vi.mock("./admin.repository.js", () => ({
    listTaskTypes,
    getTaskTypeByName,
    getTaskTypeByCode,
    createTaskType,
    updateTaskType,
    getTaskType,
    taskTypeInUse,
    deleteTaskType,
}));
const service = await import("./admin.service.js");
describe("admin task type service", () => {
    beforeEach(() => vi.clearAllMocks());
    it("lists all task types for Admin configuration", async () => {
        listTaskTypes.mockResolvedValue([{ name: "Lettering", isActive: false }]);
        await expect(service.listAdminTaskTypesService()).resolves.toEqual([{ name: "Lettering", isActive: false }]);
    });
    it("creates a unique task type with a non-negative base rate", async () => {
        getTaskTypeByName.mockResolvedValue(null);
        getTaskTypeByCode.mockResolvedValue(null);
        createTaskType.mockResolvedValue({ name: "Cleanup", code: "CLEANUP", baseRate: 100, isActive: true });
        await expect(service.createAdminTaskTypeService({ name: "Cleanup", code: "CLEANUP", description: "Clean page art", baseRate: 100 }))
            .resolves.toMatchObject({ name: "Cleanup", baseRate: 100 });
    });
    it("rejects duplicate task type names", async () => {
        getTaskTypeByName.mockResolvedValue({ name: "Cleanup" });
        await expect(service.createAdminTaskTypeService({ name: "Cleanup", code: "CLEANUP", description: "Clean page art", baseRate: 100 }))
            .rejects.toThrow("Task type with this name already exists");
    });
    it("updates editable task type fields", async () => {
        getTaskTypeByName.mockResolvedValue(null);
        updateTaskType.mockResolvedValue({ name: "Lettering Updated", description: "Updated", baseRate: 150 });
        await expect(service.updateAdminTaskTypeService("type1", { name: "Lettering Updated", description: "Updated", baseRate: 150 }))
            .resolves.toMatchObject({ name: "Lettering Updated", description: "Updated", baseRate: 150 });
    });
    it("rejects duplicate task type names during update", async () => {
        getTaskTypeByName.mockResolvedValue({ id: "type2", name: "Cleanup" });
        await expect(service.updateAdminTaskTypeService("type1", { name: "Cleanup" }))
            .rejects.toThrow("Task type with this name already exists");
        expect(updateTaskType).not.toHaveBeenCalled();
    });
    it("toggles active state through explicit services", async () => {
        updateTaskType.mockResolvedValueOnce({ name: "Tone", isActive: true });
        updateTaskType.mockResolvedValueOnce({ name: "Tone", isActive: false });
        await expect(service.activateAdminTaskTypeService("type1")).resolves.toMatchObject({ isActive: true });
        await expect(service.deactivateAdminTaskTypeService("type1")).resolves.toMatchObject({ isActive: false });
    });
    it("hard-deletes unused task types", async () => {
        getTaskType.mockResolvedValue({ _id: "type1", name: "Unused" });
        taskTypeInUse.mockResolvedValue(false);
        deleteTaskType.mockResolvedValue({ _id: "type1", name: "Unused" });
        await expect(service.deleteAdminTaskTypeService("type1")).resolves.toMatchObject({ name: "Unused" });
        expect(deleteTaskType).toHaveBeenCalledWith("type1");
    });
    it("deactivates used task types instead of hard-deleting", async () => {
        getTaskType.mockResolvedValue({ _id: "type1", name: "Used" });
        taskTypeInUse.mockResolvedValue(true);
        updateTaskType.mockResolvedValue({ _id: "type1", name: "Used", isActive: false });
        await expect(service.deleteAdminTaskTypeService("type1")).rejects.toThrow("Task type is in use and was deactivated instead");
        expect(updateTaskType).toHaveBeenCalledWith("type1", { isActive: false });
        expect(deleteTaskType).not.toHaveBeenCalled();
    });
});
//# sourceMappingURL=admin-task-type.service.test.js.map