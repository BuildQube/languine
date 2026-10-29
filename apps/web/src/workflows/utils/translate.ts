import { getModel } from "../../lib/ai";
import { generateObject } from "ai";
import { z } from "zod";
import { createFinalPrompt } from "./prompt";
import type { PromptOptions } from "./types";

const MAX_OUTPUT_TOKENS = 8000;

export const translationsSchema = z.object({
  translations: z
    .array(
      z.object({
        key: z.string().describe("The key of the input item, copied exactly"),
        translatedText: z
          .string()
          .describe("The translation of that item's text"),
      }),
    )
    .describe("Exactly one entry per input item"),
});

/**
 * Returns translations in input order, matched by key. Throws instead of
 * returning a short or misaligned array, which would write text to the wrong keys.
 */
export function alignTranslations(
  content: Array<{ key: string }>,
  translations: z.infer<typeof translationsSchema>["translations"],
) {
  const byKey = new Map(translations.map((t) => [t.key, t.translatedText]));

  const unknown = [...byKey.keys()].filter(
    (key) => !content.some((item) => item.key === key),
  );
  const missing = content
    .map((item) => item.key)
    .filter((key) => !byKey.has(key));

  if (missing.length > 0 || unknown.length > 0) {
    throw new Error(
      `Model returned mismatched keys (missing: ${missing.join(", ") || "none"}; unknown: ${unknown.join(", ") || "none"})`,
    );
  }

  return content.map((item) => byKey.get(item.key) as string);
}

export async function translateKeys(
  content: Array<{ key: string; sourceText: string }>,
  options: PromptOptions,
) {
  const prompt = createFinalPrompt(content, options, options.settings);

  const { object } = await generateObject({
    model: getModel(),
    prompt,
    temperature: 0.2,
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    schema: translationsSchema,
  });

  return alignTranslations(content, object.translations);
}

export async function translateDocument(
  content: string,
  options: PromptOptions,
) {
  return translateKeys([{ key: "content", sourceText: content }], options);
}
