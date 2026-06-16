import { Series, SeriesMember } from "../series.model.js";
import { buildSlug } from "../utils/series-slug.js";
export const BOARD_VISIBLE_STATUSES = ["BOARD_REVIEW", "APPROVED", "ONGOING", "AT_RISK", "REJECTED", "CANCELLED", "COMPLETED"];
export async function createSeriesRepository(input) {
    const slug = buildSlug(input.title);
    const series = await Series.create({
        title: input.title,
        slug,
        synopsis: input.synopsis,
        logline: input.logline,
        premise: input.premise,
        characters: input.characters,
        conflict: input.conflict,
        targetAudience: input.targetAudience,
        requestedPublicationType: input.requestedPublicationType,
        publicationType: input.publicationType,
        tags: input.tags ?? [],
        genres: input.genres ?? [],
        ownerId: input.ownerId,
        status: "DRAFT",
    });
    await SeriesMember.create({
        seriesId: series.id,
        userId: input.ownerId,
        role: "MANGAKA",
        isActive: true,
    });
    return {
        id: series.id,
        title: series.title,
        slug: series.slug,
        synopsis: series.synopsis,
        logline: series.logline,
        premise: series.premise,
        characters: series.characters,
        conflict: series.conflict,
        targetAudience: series.targetAudience,
        requestedPublicationType: series.requestedPublicationType,
        publicationType: series.publicationType,
        tags: series.tags ?? [],
        genres: series.genres,
        ownerId: String(series.ownerId),
        status: series.status,
        createdAt: series.createdAt,
        updatedAt: series.updatedAt,
    };
}
export async function listSeriesForActor(userId, role) {
    if (role === "ASSISTANT") {
        throw new Error("Assistants cannot list Series; access is task-scoped only");
    }
    const filter = role === "MANGAKA"
        ? { ownerId: userId }
        : role === "BOARD"
            ? { status: { $in: BOARD_VISIBLE_STATUSES } }
            : {};
    return Series.find(filter).sort({ updatedAt: -1 });
}
export async function getSeriesForActor(seriesId, userId, role) {
    const series = await Series.findById(seriesId);
    if (!series)
        return null;
    const isBoardVisible = role === "BOARD" && BOARD_VISIBLE_STATUSES.includes(series.status);
    const canViewAll = role === "ADMIN" || role === "EDITOR" || isBoardVisible;
    if (!canViewAll && String(series.ownerId) !== userId) {
        throw new Error("Series access denied");
    }
    return series;
}
export async function getSeriesById(seriesId) {
    return Series.findById(seriesId);
}
export async function updateSeriesStatus(seriesId, status) {
    return Series.findByIdAndUpdate(seriesId, { status }, { new: true });
}
const UPDATABLE_STATUSES = ["DRAFT", "REVISION_REQUESTED"];
export async function updateSeriesRepository(seriesId, userId, input) {
    const series = await Series.findById(seriesId);
    if (!series) {
        throw new Error("Series not found");
    }
    if (String(series.ownerId) !== userId) {
        throw new Error("Only the owner Mangaka can update this series");
    }
    if (!UPDATABLE_STATUSES.includes(series.status)) {
        throw new Error("Series can only be edited while in DRAFT or REVISION_REQUESTED");
    }
    const patch = {};
    if (input.title !== undefined)
        patch.title = input.title;
    if (input.synopsis !== undefined)
        patch.synopsis = input.synopsis;
    if (input.logline !== undefined)
        patch.logline = input.logline;
    if (input.premise !== undefined)
        patch.premise = input.premise;
    if (input.characters !== undefined)
        patch.characters = input.characters;
    if (input.conflict !== undefined)
        patch.conflict = input.conflict;
    if (input.targetAudience !== undefined)
        patch.targetAudience = input.targetAudience;
    if (input.requestedPublicationType !== undefined)
        patch.requestedPublicationType = input.requestedPublicationType;
    if (input.publicationType !== undefined)
        patch.publicationType = input.publicationType;
    if (input.tags !== undefined)
        patch.tags = input.tags;
    if (input.genres !== undefined)
        patch.genres = input.genres;
    // Only rebuild the slug when the title actually changes. Slugs must stay
    // unique, so leave existing one in place if title is unchanged.
    if (typeof patch.title === "string" && patch.title !== series.title) {
        patch.slug = buildSlug(patch.title);
    }
    Object.assign(series, patch);
    await series.save();
    return {
        id: series.id,
        title: series.title,
        slug: series.slug,
        synopsis: series.synopsis,
        logline: series.logline,
        premise: series.premise,
        characters: series.characters,
        conflict: series.conflict,
        targetAudience: series.targetAudience,
        requestedPublicationType: series.requestedPublicationType,
        publicationType: series.publicationType,
        tags: series.tags ?? [],
        genres: series.genres ?? [],
        ownerId: String(series.ownerId),
        status: series.status,
        createdAt: series.createdAt,
        updatedAt: series.updatedAt,
    };
}
//# sourceMappingURL=series.repository.js.map