export function toCreateTaskResult(task) {
    return {
        id: task.id,
        seriesId: String(task.seriesId),
        chapterId: String(task.chapterId),
        pageId: task.pageId ? String(task.pageId) : undefined,
        regionId: task.regionId ? String(task.regionId) : undefined,
        taskTypeId: String(task.taskTypeId),
        assignedTo: String(task.assignedTo),
        assignedBy: String(task.assignedBy),
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        baseRate: task.baseRate,
        dueDate: task.dueDate,
        contextPageIds: task.contextPageIds.map(String),
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
    };
}
//# sourceMappingURL=task.mapper.js.map