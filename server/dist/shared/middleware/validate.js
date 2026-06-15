export function validate(schema, source = "body") {
    return (req, res, next) => {
        const requestPayload = {
            body: req.body,
            query: req.query,
            params: req.params,
        };
        const requestResult = schema.safeParse(requestPayload);
        if (requestResult.success) {
            const data = requestResult.data;
            if (data.body !== undefined)
                req.body = data.body;
            if (data.query !== undefined)
                req.query = data.query;
            if (data.params !== undefined)
                req.params = data.params;
            next();
            return;
        }
        const sourceResult = schema.safeParse(req[source]);
        if (sourceResult.success) {
            req[source] = sourceResult.data;
            next();
            return;
        }
        const messages = requestResult.error.issues.map((i) => i.message);
        res.status(400).json({ success: false, message: messages.join("; ") });
    };
}
//# sourceMappingURL=validate.js.map