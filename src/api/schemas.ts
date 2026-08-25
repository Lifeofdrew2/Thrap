import { z } from "zod";

export const humanRouteSchema = z.object({
  role: z.string().min(1),
  channelLabel: z.string().min(1),
  actionTarget: z.string().min(1),
});

const turnStateSchema = z.object({
  used: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
});

const citationSchema = z.object({
  documentTitle: z.string().min(1),
  section: z.string().min(1),
  version: z.string().optional(),
});

export const escalationResponseSchema = z.object({
  kind: z.literal("escalation"),
  message: z.string(),
  humanRoute: humanRouteSchema,
  reasonCode: z
    .enum([
      "crisis",
      "output_guard",
      "classifier_failure",
      "backend_failure",
      "network_failure",
      "invalid_response",
      "human_route_failure",
    ])
    .optional(),
});

export const serviceResponseSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("answer"), message: z.string(), citations: z.array(citationSchema), turn: turnStateSchema, bookingPrompt: z.boolean().optional() }),
  z.object({ kind: z.literal("refusal"), message: z.string(), humanRoute: humanRouteSchema, turn: turnStateSchema }),
  escalationResponseSchema,
  z.object({ kind: z.literal("turn_limit"), message: z.string(), humanRoute: humanRouteSchema, turn: turnStateSchema }),
]);
export type ServiceResponse = z.infer<typeof serviceResponseSchema>;
