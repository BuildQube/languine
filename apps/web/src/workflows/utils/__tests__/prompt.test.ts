import { describe, expect, test } from "bun:test";

import { createFinalPrompt } from "../prompt";

describe("createFinalPrompt", () => {
  test("includes source/target language names and source text", () => {
    const prompt = createFinalPrompt(
      [{ key: "greeting", sourceText: "Hello" }],
      { sourceLocale: "en", targetLocale: "sv" },
    );

    expect(prompt).toContain("English");
    expect(prompt).toContain("(en)");
    expect(prompt).toContain("Swedish");
    expect(prompt).toContain("(sv)");
    expect(prompt).toContain("Hello");
  });

  test("uses Markdown framing when sourceFormat is md", () => {
    const prompt = createFinalPrompt(
      [{ key: "doc", sourceText: "# Hi" }],
      { sourceLocale: "en", targetLocale: "fr", sourceFormat: "md" },
    );

    expect(prompt.toLowerCase()).toContain("markdown");
  });

  test("includes tuning instructions when settings are provided", () => {
    const prompt = createFinalPrompt(
      [{ key: "k", sourceText: "Hi" }],
      { sourceLocale: "en", targetLocale: "de" },
      {
        formality: "formal",
        toneOfVoice: "professional",
        brandName: "Acme",
      },
    );

    expect(prompt).toContain("formal");
    expect(prompt).toContain("professional");
    expect(prompt).toContain("Acme");
  });

  test("sends each key alongside its text for context", () => {
    const prompt = createFinalPrompt(
      [{ key: "notification.filter.archived", sourceText: "Archived" }],
      { sourceLocale: "en", targetLocale: "es" },
    );

    expect(prompt).toContain('"key": "notification.filter.archived"');
    expect(prompt).toContain('"text": "Archived"');
  });

  test("includes the project glossary as a binding instruction", () => {
    const prompt = createFinalPrompt(
      [{ key: "takeoff.actions.create", sourceText: "New takeoff" }],
      { sourceLocale: "en", targetLocale: "es" },
      { terminology: "takeoff → cuantificación" },
    );

    expect(prompt).toContain("glossary");
    expect(prompt).toContain("takeoff → cuantificación");
  });
});
