import { addSeriesMemberService } from "./series-member.service.js";
export async function addSeriesMember(req, res) {
    const member = await addSeriesMemberService({
        seriesId: String(req.params.seriesId),
        userId: req.body.userId,
        role: req.body.role,
        accessScope: req.body.accessScope,
        actorId: req.user.userId,
    });
    res.status(201).json({ success: true, message: "Member added successfully", data: member });
}
//# sourceMappingURL=series-member.controller.js.map