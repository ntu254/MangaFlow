import { addSeriesMemberService, listSeriesMembersService, updateSeriesMemberService, removeSeriesMemberService, getEligibleAssistantsService, } from "./series-member.service.js";
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
export async function listSeriesMembers(req, res) {
    const members = await listSeriesMembersService(String(req.params.seriesId), req.user.userId, req.user.role);
    res.json({ success: true, message: "Members retrieved", data: members });
}
export async function updateSeriesMember(req, res) {
    const member = await updateSeriesMemberService({
        seriesId: String(req.params.seriesId),
        memberId: String(req.params.memberId),
        status: req.body.status,
        actorId: req.user.userId,
    });
    res.json({ success: true, message: "Member updated", data: member });
}
export async function removeSeriesMember(req, res) {
    const member = await removeSeriesMemberService({
        seriesId: String(req.params.seriesId),
        memberId: String(req.params.memberId),
        actorId: req.user.userId,
    });
    res.json({ success: true, message: "Member removed", data: member });
}
export async function getEligibleAssistants(req, res) {
    const assistants = await getEligibleAssistantsService(String(req.params.seriesId), req.user.userId, req.user.role);
    res.json({ success: true, message: "Eligible assistants retrieved", data: assistants });
}
//# sourceMappingURL=series-member.controller.js.map