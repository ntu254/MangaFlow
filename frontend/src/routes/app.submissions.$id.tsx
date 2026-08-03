import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";

const searchSchema = z.object({
  edit: z
    .preprocess((value) => value === true || value === 1 || value === "1", z.boolean())
    .optional(),
});

export const Route = createFileRoute("/app/submissions/$id")({
  validateSearch: searchSchema,
  beforeLoad: ({ params, search }) => {
    throw redirect({
      to: "/app/proposals/$proposalId",
      params: { proposalId: params.id },
      search: search as { edit?: boolean },
    });
  },
});
