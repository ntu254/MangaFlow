import mongoose from "mongoose";
import { AppError } from "../errors/AppError.js";
import { ZodError } from "zod";
export function errorHandler(err, _req, res, _next) {
    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            success: false,
            message: err.message,
        });
        return;
    }
    // Malformed ObjectId (or other cast failures) reaching a query is a client
    // error, not a server fault — return 400 instead of leaking a 500/crash.
    if (err instanceof mongoose.Error.CastError) {
        res.status(400).json({
            success: false,
            message: `Invalid ${err.path}: ${String(err.value)}`,
        });
        return;
    }
    if (err instanceof ZodError) {
        res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: err.errors.map((e) => ({
                path: e.path.join("."),
                message: e.message,
            })),
        });
        return;
    }
    console.error("Unhandled error:", err);
    res.status(500).json({
        success: false,
        message: "Internal server error",
    });
}
//# sourceMappingURL=errorHandler.js.map