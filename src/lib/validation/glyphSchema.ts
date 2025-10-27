// CLAUDE-META: Phase 9A Hybrid Patch - Glyph Validation Schema
// Architect: ChatGPT (GPT-5) Canonical Authority
// Purpose: Zod schema for glyph validation with injection prevention
// Status: Production - Hybrid Safe Mode Active

import { z } from "zod";

export const glyphSchema = z.object({
  symbol: z.string().min(1).max(8).regex(/^[^\s]+$/),
  meaning: z.string().min(1).max(512),
  meta: z.record(z.string(), z.unknown()).optional(),
});

export type Glyph = z.infer<typeof glyphSchema>;

export function validateGlyph(data: unknown) {
  return glyphSchema.safeParse(data);
}

// very basic injection guard (expand later)
export function sanitizeMeaning(meaning: string) {
  const blocked = [/ignore.*instructions/i, /grant.*admin/i, /delete.*all/i];
  if (blocked.some(rx => rx.test(meaning))) {
    return "[blocked-content]";
  }
  return meaning;
}
