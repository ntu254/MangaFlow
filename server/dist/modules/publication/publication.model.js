import mongoose, { Schema } from "mongoose";
const publicationSchema = new Schema({
    chapterId: { type: Schema.Types.ObjectId, ref: "Chapter", required: true, unique: true, index: true },
    seriesId: { type: Schema.Types.ObjectId, ref: "Series", required: true, index: true },
    scheduledFor: { type: Date, index: true },
    publishedAt: { type: Date, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    scheduleManagedBy: { type: Schema.Types.ObjectId, ref: "User" },
    publishedBy: { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });
publicationSchema.set("toJSON", {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    transform(_doc, ret) {
        delete ret.__v;
        ret.id = ret._id;
        delete ret._id;
        return ret;
    },
});
export const Publication = mongoose.model("Publication", publicationSchema);
//# sourceMappingURL=publication.model.js.map