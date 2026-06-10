import type { Request, Response, NextFunction } from "express"
import type { ZodSchema } from "zod"

export function validate(schema: ZodSchema, source: "body" | "query" | "params" = "body") {
  return (req: Request, res: Response, next: NextFunction): void => {
    const requestPayload = {
      body: req.body,
      query: req.query,
      params: req.params,
    }

    const requestResult = schema.safeParse(requestPayload)
    if (requestResult.success) {
      const data = requestResult.data as Partial<typeof requestPayload>
      if (data.body !== undefined) req.body = data.body
      if (data.query !== undefined) req.query = data.query as typeof req.query
      if (data.params !== undefined) req.params = data.params as typeof req.params
      next()
      return
    }

    const sourceResult = schema.safeParse(req[source])
    if (sourceResult.success) {
      req[source] = sourceResult.data as typeof req[typeof source]
      next()
      return
    }

    const messages = requestResult.error.issues.map((i) => i.message)
    res.status(400).json({ success: false, message: messages.join("; ") })
  }
}