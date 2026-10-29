import { describe, expect, mock, test } from "bun:test";

let lastPrompt = "";
let modelOutput: unknown;

// Parse with the real schema passed by translateKeys, as the AI SDK does.
mock.module("ai", () => ({
  generateObject: async ({
    prompt,
    schema,
  }: {
    prompt: string;
    schema: { parse: (v: unknown) => unknown };
  }) => {
    lastPrompt = prompt;
    return { object: schema.parse(modelOutput) };
  },
}));

mock.module("../../../lib/ai", () => ({ getModel: () => ({}) }));

const content = [
  { key: "takeoff.actions.create", sourceText: "New takeoff" },
  { key: "notification.filter.archived", sourceText: "Archived" },
];

describe("translateKeys", () => {
  test("passes project settings and keys into the prompt", async () => {
    const { translateKeys } = await import("../translate");
    modelOutput = {
      translations: [
        { key: "takeoff.actions.create", translatedText: "Nueva cuantificación" },
        { key: "notification.filter.archived", translatedText: "Archivadas" },
      ],
    };

    await translateKeys(content, {
      sourceLocale: "en",
      targetLocale: "es",
      settings: { terminology: "takeoff → cuantificación" },
    });

    expect(lastPrompt).toContain("takeoff → cuantificación");
    expect(lastPrompt).toContain("takeoff.actions.create");
    expect(lastPrompt).toContain('"translatedText"');
  });

  test("maps results back by key, even when reordered", async () => {
    const { translateKeys } = await import("../translate");
    modelOutput = {
      translations: [
        { key: "notification.filter.archived", translatedText: "Archivadas" },
        { key: "takeoff.actions.create", translatedText: "Nueva cuantificación" },
      ],
    };

    const result = await translateKeys(content, {
      sourceLocale: "en",
      targetLocale: "es",
    });

    expect(result).toEqual(["Nueva cuantificación", "Archivadas"]);
  });

  test("throws when a key is missing", async () => {
    const { translateKeys } = await import("../translate");
    modelOutput = {
      translations: [
        { key: "takeoff.actions.create", translatedText: "Nueva cuantificación" },
      ],
    };

    await expect(
      translateKeys(content, { sourceLocale: "en", targetLocale: "es" }),
    ).rejects.toThrow("missing: notification.filter.archived");
  });

  test("throws on an unknown key", async () => {
    const { translateKeys } = await import("../translate");
    modelOutput = {
      translations: [
        { key: "takeoff.actions.create", translatedText: "Nueva cuantificación" },
        { key: "notification.filter.archived", translatedText: "Archivadas" },
        { key: "made.up", translatedText: "?" },
      ],
    };

    await expect(
      translateKeys(content, { sourceLocale: "en", targetLocale: "es" }),
    ).rejects.toThrow("unknown: made.up");
  });

  test("schema rejects the old bare-string shape", async () => {
    const { translationsSchema } = await import("../translate");

    expect(() =>
      translationsSchema.parse({ translations: ["Nueva cuantificación"] }),
    ).toThrow();
  });

  test("translateDocument returns the translated document", async () => {
    const { translateDocument } = await import("../translate");
    modelOutput = {
      translations: [{ key: "content", translatedText: "# Hola" }],
    };

    expect(
      await translateDocument("# Hi", {
        sourceLocale: "en",
        targetLocale: "es",
        sourceFormat: "md",
      }),
    ).toEqual(["# Hola"]);
  });
});
