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
/**
 * Flow-02: confirm-upload expects all three derived assets so the system can
 * link originalFileAssetId / workingFileAssetId / thumbnailFileAssetId.
 */
export declare const confirmPageUploadSchema: z.ZodObject<{
    params: z.ZodObject<{
        pageId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        pageId: string;
    }, {
        pageId: string;
    }>;
    body: z.ZodObject<{
        original: z.ZodObject<{
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
        working: z.ZodObject<{
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
        thumbnail: z.ZodObject<{
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
        original: {
            fileAssetId: string;
            originalName: string;
            mimeType: "image/jpeg" | "image/png" | "image/webp" | "application/pdf";
            size: number;
            r2Key: string;
        };
        working: {
            fileAssetId: string;
            originalName: string;
            mimeType: "image/jpeg" | "image/png" | "image/webp" | "application/pdf";
            size: number;
            r2Key: string;
        };
        thumbnail: {
            fileAssetId: string;
            originalName: string;
            mimeType: "image/jpeg" | "image/png" | "image/webp" | "application/pdf";
            size: number;
            r2Key: string;
        };
    }, {
        original: {
            fileAssetId: string;
            originalName: string;
            mimeType: "image/jpeg" | "image/png" | "image/webp" | "application/pdf";
            size: number;
            r2Key: string;
        };
        working: {
            fileAssetId: string;
            originalName: string;
            mimeType: "image/jpeg" | "image/png" | "image/webp" | "application/pdf";
            size: number;
            r2Key: string;
        };
        thumbnail: {
            fileAssetId: string;
            originalName: string;
            mimeType: "image/jpeg" | "image/png" | "image/webp" | "application/pdf";
            size: number;
            r2Key: string;
        };
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        original: {
            fileAssetId: string;
            originalName: string;
            mimeType: "image/jpeg" | "image/png" | "image/webp" | "application/pdf";
            size: number;
            r2Key: string;
        };
        working: {
            fileAssetId: string;
            originalName: string;
            mimeType: "image/jpeg" | "image/png" | "image/webp" | "application/pdf";
            size: number;
            r2Key: string;
        };
        thumbnail: {
            fileAssetId: string;
            originalName: string;
            mimeType: "image/jpeg" | "image/png" | "image/webp" | "application/pdf";
            size: number;
            r2Key: string;
        };
    };
    params: {
        pageId: string;
    };
}, {
    body: {
        original: {
            fileAssetId: string;
            originalName: string;
            mimeType: "image/jpeg" | "image/png" | "image/webp" | "application/pdf";
            size: number;
            r2Key: string;
        };
        working: {
            fileAssetId: string;
            originalName: string;
            mimeType: "image/jpeg" | "image/png" | "image/webp" | "application/pdf";
            size: number;
            r2Key: string;
        };
        thumbnail: {
            fileAssetId: string;
            originalName: string;
            mimeType: "image/jpeg" | "image/png" | "image/webp" | "application/pdf";
            size: number;
            r2Key: string;
        };
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
/**
 * Flow-04: Region creation — regionIndex is auto-assigned by the service.
 * Only bbox and type are provided by the client.
 */
export declare const createRegionSchema: z.ZodObject<{
    params: z.ZodObject<{
        pageId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        pageId: string;
    }, {
        pageId: string;
    }>;
    body: z.ZodObject<{
        type: z.ZodOptional<z.ZodEnum<["PANEL", "BUBBLE", "SFX", "AREA", "OTHER"]>>;
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
        bbox: {
            y: number;
            x: number;
            width: number;
            height: number;
        };
        type?: "PANEL" | "BUBBLE" | "SFX" | "AREA" | "OTHER" | undefined;
    }, {
        bbox: {
            y: number;
            x: number;
            width: number;
            height: number;
        };
        type?: "PANEL" | "BUBBLE" | "SFX" | "AREA" | "OTHER" | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        bbox: {
            y: number;
            x: number;
            width: number;
            height: number;
        };
        type?: "PANEL" | "BUBBLE" | "SFX" | "AREA" | "OTHER" | undefined;
    };
    params: {
        pageId: string;
    };
}, {
    body: {
        bbox: {
            y: number;
            x: number;
            width: number;
            height: number;
        };
        type?: "PANEL" | "BUBBLE" | "SFX" | "AREA" | "OTHER" | undefined;
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
/**
 * Flow-04: Update region type and/or bbox coordinates.
 * Replaces the old updateRegionStatus (ACTIVE/ARCHIVED) with geometry/type edits.
 */
export declare const updateRegionSchema: z.ZodObject<{
    params: z.ZodObject<{
        regionId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        regionId: string;
    }, {
        regionId: string;
    }>;
    body: z.ZodEffects<z.ZodObject<{
        type: z.ZodOptional<z.ZodEnum<["PANEL", "BUBBLE", "SFX", "AREA", "OTHER"]>>;
        bbox: z.ZodOptional<z.ZodObject<{
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
        }>>;
    }, "strip", z.ZodTypeAny, {
        type?: "PANEL" | "BUBBLE" | "SFX" | "AREA" | "OTHER" | undefined;
        bbox?: {
            y: number;
            x: number;
            width: number;
            height: number;
        } | undefined;
    }, {
        type?: "PANEL" | "BUBBLE" | "SFX" | "AREA" | "OTHER" | undefined;
        bbox?: {
            y: number;
            x: number;
            width: number;
            height: number;
        } | undefined;
    }>, {
        type?: "PANEL" | "BUBBLE" | "SFX" | "AREA" | "OTHER" | undefined;
        bbox?: {
            y: number;
            x: number;
            width: number;
            height: number;
        } | undefined;
    }, {
        type?: "PANEL" | "BUBBLE" | "SFX" | "AREA" | "OTHER" | undefined;
        bbox?: {
            y: number;
            x: number;
            width: number;
            height: number;
        } | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        type?: "PANEL" | "BUBBLE" | "SFX" | "AREA" | "OTHER" | undefined;
        bbox?: {
            y: number;
            x: number;
            width: number;
            height: number;
        } | undefined;
    };
    params: {
        regionId: string;
    };
}, {
    body: {
        type?: "PANEL" | "BUBBLE" | "SFX" | "AREA" | "OTHER" | undefined;
        bbox?: {
            y: number;
            x: number;
            width: number;
            height: number;
        } | undefined;
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
export declare const aiResultIdParamsSchema: z.ZodObject<{
    params: z.ZodObject<{
        aiResultId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        aiResultId: string;
    }, {
        aiResultId: string;
    }>;
}, "strip", z.ZodTypeAny, {
    params: {
        aiResultId: string;
    };
}, {
    params: {
        aiResultId: string;
    };
}>;
export declare const aiSuggestionDecisionSchema: z.ZodObject<{
    params: z.ZodObject<{
        aiResultId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        aiResultId: string;
    }, {
        aiResultId: string;
    }>;
    body: z.ZodObject<{
        suggestionIndex: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        suggestionIndex: number;
    }, {
        suggestionIndex: number;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        suggestionIndex: number;
    };
    params: {
        aiResultId: string;
    };
}, {
    body: {
        suggestionIndex: number;
    };
    params: {
        aiResultId: string;
    };
}>;
//# sourceMappingURL=file.validation.d.ts.map