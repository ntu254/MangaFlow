import mongoose, { type Document } from "mongoose";
export interface PublicationDocument extends Document {
    chapterId: mongoose.Types.ObjectId;
    seriesId: mongoose.Types.ObjectId;
    scheduledFor?: Date;
    publishedAt?: Date;
    createdBy: mongoose.Types.ObjectId;
    scheduleManagedBy?: mongoose.Types.ObjectId;
    publishedBy?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Publication: mongoose.Model<PublicationDocument, {}, {}, {}, mongoose.Document<unknown, {}, PublicationDocument, {}, {}> & PublicationDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=publication.model.d.ts.map