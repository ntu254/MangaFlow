import { createPublicationService, publishPublicationService, schedulePublicationService } from "./publication.service.js";
export async function createPublication(req, res) {
    const publication = await createPublicationService({
        chapterId: req.body.chapterId,
        scheduledFor: req.body.scheduledFor,
        actor: req.user,
    });
    res.status(201).json({ success: true, message: "Publication created", data: publication });
}
export async function schedulePublication(req, res) {
    const publication = await schedulePublicationService({
        publicationId: String(req.params.publicationId),
        scheduledFor: req.body.scheduledFor,
        actor: req.user,
    });
    res.json({ success: true, message: "Publication scheduled", data: publication });
}
export async function publishPublication(req, res) {
    const publication = await publishPublicationService(String(req.params.publicationId), req.user);
    res.json({ success: true, message: "Publication published", data: publication });
}
//# sourceMappingURL=publication.controller.js.map