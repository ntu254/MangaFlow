import mongoose, { Schema } from "mongoose";
const userSchema = new Schema({
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    displayName: { type: String, trim: true, maxlength: 100 },
    team: { type: String, trim: true, maxlength: 100 },
    notes: { type: String, trim: true, maxlength: 1000 },
    role: { type: String, enum: ["ADMIN", "MANGAKA", "ASSISTANT", "EDITOR", "BOARD"], required: true, default: "MANGAKA" },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });
userSchema.set("toJSON", {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    transform(_doc, ret) {
        delete ret.passwordHash;
        delete ret.__v;
        ret.id = ret._id;
        delete ret._id;
        return ret;
    },
});
export const User = mongoose.model("User", userSchema);
const refreshTokenSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    token: { type: String, required: true, index: true },
    expiresAt: { type: Date, required: true },
}, { timestamps: true });
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export const RefreshToken = mongoose.model("RefreshToken", refreshTokenSchema);
//# sourceMappingURL=auth.model.js.map