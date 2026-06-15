import mongoose, { type Document } from "mongoose";
import type { UserRole } from "./auth.types.js";
export interface UserDocument extends Document {
    email: string;
    passwordHash: string;
    name: string;
    displayName?: string;
    team?: string;
    notes?: string;
    role: UserRole;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const User: mongoose.Model<UserDocument, {}, {}, {}, mongoose.Document<unknown, {}, UserDocument, {}, {}> & UserDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export declare const RefreshToken: mongoose.Model<{
    userId: mongoose.Types.ObjectId;
    token: string;
    expiresAt: NativeDate;
} & mongoose.DefaultTimestampProps, {}, {}, {}, mongoose.Document<unknown, {}, {
    userId: mongoose.Types.ObjectId;
    token: string;
    expiresAt: NativeDate;
} & mongoose.DefaultTimestampProps, {}, {
    timestamps: true;
}> & {
    userId: mongoose.Types.ObjectId;
    token: string;
    expiresAt: NativeDate;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    userId: mongoose.Types.ObjectId;
    token: string;
    expiresAt: NativeDate;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    userId: mongoose.Types.ObjectId;
    token: string;
    expiresAt: NativeDate;
} & mongoose.DefaultTimestampProps>, {}, mongoose.MergeType<mongoose.DefaultSchemaOptions, {
    timestamps: true;
}>> & mongoose.FlatRecord<{
    userId: mongoose.Types.ObjectId;
    token: string;
    expiresAt: NativeDate;
} & mongoose.DefaultTimestampProps> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
//# sourceMappingURL=auth.model.d.ts.map