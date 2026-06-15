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