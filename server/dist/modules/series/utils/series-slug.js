export function buildSlug(title) {
    let base = title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .slice(0, 60);
    if (!base) {
        base = "series";
    }
    return base;
}
//# sourceMappingURL=series-slug.js.map