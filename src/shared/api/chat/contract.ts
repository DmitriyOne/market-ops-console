import { z } from 'zod';

import { periodSchema } from '../dataset/schema';

export const citationSchema = z.object({
  marketId: z.string().optional(),
  regionId: z.string().optional(),
  productId: z.string().optional(),
  period: periodSchema.optional(),
  label: z.string().optional(),
});

export const confidenceSchema = z.enum(['high', 'medium', 'low']);
export const answerKindSchema = z.enum(['normal', 'low_confidence', 'abstain', 'error']);

export const chatEventSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('token'), value: z.string() }),
  z.object({
    type: z.literal('done'),
    kind: answerKindSchema,
    citations: z.array(citationSchema),
    confidence: confidenceSchema,
  }),
  z.object({ type: z.literal('error'), message: z.string() }),
]);

export const CHAT_QUESTION_MAX_LENGTH = 500;

export const chatRequestSchema = z.object({
  question: z.string().trim().min(1).max(CHAT_QUESTION_MAX_LENGTH),
});

const answerSchema = z.object({
  text: z.string(),
  citations: z.array(citationSchema),
  confidence: confidenceSchema,
});

const fixtureSchema = z.object({
  id: z.string(),
  keywords: z.array(z.string()).optional(),
  kind: answerKindSchema,
  answer: answerSchema,
  error: z.string().optional(),
});

export const fixturesSchema = z.object({
  note: z.string().optional(),
  default: fixtureSchema,
  fixtures: z.array(fixtureSchema),
});

export type Citation = z.infer<typeof citationSchema>;
export type Confidence = z.infer<typeof confidenceSchema>;
export type AnswerKind = z.infer<typeof answerKindSchema>;
export type ChatEvent = z.infer<typeof chatEventSchema>;
export type ChatRequest = z.infer<typeof chatRequestSchema>;
export type Fixture = z.infer<typeof fixtureSchema>;
export type Fixtures = z.infer<typeof fixturesSchema>;
