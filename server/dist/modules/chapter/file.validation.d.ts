import { z } from "zod";
export declare const getPresignedUploadUrlSchema: z.ZodObject<{
    body: z.ZodObject<{
        originalName: z.ZodString;
        contentType: z.ZodEnum<["image/jpeg", "image/png", "image/webp", "application/pdf"]>;
        expiresIn: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        originalName: string;
        contentType: "image/jpeg" | "image/png" | "image/webp" | "application/pdf";
        expiresIn?: number | undefined;
    }, {
        originalName: string;
        contentType: "image/jpeg" | "image/png" | "image/webp" | "application/pdf";
        expiresIn?: number | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        originalName: string;
        contentType: "image/jpeg" | "image/png" | "image/webp" | "application/pdf";
        expiresIn?: number | undefined;
    };
}, {
    body: {
        originalName: string;
        contentType: "image/jpeg" | "image/png" | "image/webp" | "application/pdf";
        expiresIn?: number | undefined;
    };
}>;
export declare const pageIdParamsSchema: z.ZodObject<{
    params: z.ZodObject<{
        pageId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        pageId: string;
    }, {
        pageId: string;
    }>;
}, "strip", z.ZodTypeAny, {
    params: {
        pageId: string;
    };
}, {
    params: {
        pageId: string;
    };
}>;
export declare const confirmPageUploadSchema: z.ZodObject<{
    params: z.ZodObject<{
        pageId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        pageId: string;
    }, {
        pageId: string;
    }>;
    body: z.ZodObject<{
        fileAssetId: z.ZodString;
        r2Key: z.ZodString;
        originalName: z.ZodString;
        mimeType: z.ZodEnum<["image/jpeg", "image/png", "image/webp", "application/pdf"]>;
        size: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        fileAssetId: string;
        originalName: string;
        mimeType: "image/jpeg" | "image/png" | "image/webp" | "application/pdf";
        size: number;
        r2Key: string;
    }, {
        fileAssetId: string;
        originalName: string;
        mimeType: "image/jpeg" | "image/png" | "image/webp" | "application/pdf";
        size: number;
        r2Key: string;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        fileAssetId: string;
        originalName: string;
        mimeType: "image/jpeg" | "image/png" | "image/webp" | "application/pdf";
        size: number;
        r2Key: string;
    };
    params: {
        pageId: string;
    };
}, {
    body: {
        fileAssetId: string;
        originalName: string;
        mimeType: "image/jpeg" | "image/png" | "image/webp" | "application/pdf";
        size: number;
        r2Key: string;
    };
    params: {
        pageId: string;
    };
}>;
export declare const fileAssetIdParamsSchema: z.ZodObject<{
    params: z.ZodObject<{
        fileAssetId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        fileAssetId: string;
    }, {
        fileAssetId: string;
    }>;
}, "strip", z.ZodTypeAny, {
    params: {
        fileAssetId: string;
    };
}, {
    params: {
        fileAssetId: string;
    };
}>;
export declare const createRegionSchema: z.ZodObject<{
    params: z.ZodObject<{
        pageId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        pageId: string;
    }, {
        pageId: string;
    }>;
    body: z.ZodObject<{
        regionIndex: z.ZodNumber;
        bbox: z.ZodObject<{
            x: z.ZodNumber;
            y: z.ZodNumber;
            width: z.ZodNumber;
            height: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            y: number;
            x: number;
            width: number;
            height: number;
        }, {
            y: number;
            x: number;
            width: number;
            height: number;
        }>;
    }, "strip", z.ZodTypeAny, {
        regionIndex: number;
        bbox: {
            y: number;
            x: number;
            width: number;
            height: number;
        };
    }, {
        regionIndex: number;
        bbox: {
            y: number;
            x: number;
            width: number;
            height: number;
        };
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        regionIndex: number;
        bbox: {
            y: number;
            x: number;
            width: number;
            height: number;
        };
    };
    params: {
        pageId: string;
    };
}, {
    body: {
        regionIndex: number;
        bbox: {
            y: number;
            x: number;
            width: number;
            height: number;
        };
    };
    params: {
        pageId: string;
    };
}>;
export declare const regionIdParamsSchema: z.ZodObject<{
    params: z.ZodObject<{
        regionId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        regionId: string;
    }, {
        regionId: string;
    }>;
}, "strip", z.ZodTypeAny, {
    params: {
        regionId: string;
    };
}, {
    params: {
        regionId: string;
    };
}>;
export declare const updateRegionStatusSchema: z.ZodObject<{
    params: z.ZodObject<{
        regionId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        regionId: string;
    }, {
        regionId: string;
    }>;
    body: z.ZodObject<{
        status: z.ZodEnum<["ACTIVE", "ARCHIVED"]>;
    }, "strip", z.ZodTypeAny, {
        status: "ACTIVE" | "ARCHIVED";
    }, {
        status: "ACTIVE" | "ARCHIVED";
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        status: "ACTIVE" | "ARCHIVED";
    };
    params: {
        regionId: string;
    };
}, {
    body: {
        status: "ACTIVE" | "ARCHIVED";
    };
    params: {
        regionId: string;
    };
}>;
export declare const listRegionsParamsSchema: z.ZodObject<{
    params: z.ZodObject<{
        pageId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        pageId: string;
    }, {
        pageId: string;
    }>;
}, "strip", z.ZodTypeAny, {
    params: {
        pageId: string;
    };
}, {
    params: {
        pageId: string;
    };
}>;
//# sourceMappingURL=file.validation.d.ts.map