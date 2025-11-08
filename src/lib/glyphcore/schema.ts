import { z } from 'zod';

export const GlyphContentSchema = z.object({
  mime: z.string().default('text/plain'),
  encoding: z.enum(['utf8', 'base64']).default('utf8'),
  data: z.string().default(''),
});

export const GlyphDocumentSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  version: z.string().default('1'),
  author: z.string().optional().default('unknown'),
  tags: z.array(z.string()).default([]),
  createdAt: z.coerce.number().int().default(Date.now()),
  updatedAt: z.coerce.number().int().default(Date.now()),
  content: GlyphContentSchema,
  meta: z.record(z.string(), z.any()).optional().default({}),
});

export type GlyphDocument = z.infer<typeof GlyphDocumentSchema>;

export function validateGlyph(doc: unknown): GlyphDocument {
  return GlyphDocumentSchema.parse(doc);
}
