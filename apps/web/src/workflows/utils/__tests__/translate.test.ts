import { describe, expect, mock, test } from "bun:test";

let lastPrompt = "";

mock.module("ai", () => ({
  generateObject: async ({ prompt }: { prompt: string }) => {
    lastPrompt = prompt;
    return { object: { translatedKeys: ["Nueva cuantificación"] } };
  },
}));

mock.module("../../../lib/ai", () => ({ getModel: () => ({}) }));

describe("translateKeys", () => {
  test("passes project settings into the prompt", async () => {
    const { translateKeys } = await import("../translate");

    const result = await translateKeys(
      [{ key: "takeoff.actions.create", sourceText: "New takeoff" }],
      {
        sourceLocale: "en",
        targetLocale: "es",
        settings: { terminology: "takeoff → cuantificación" },
      },
    );

    expect(result).toEqual(["Nueva cuantificación"]);
    expect(lastPrompt).toContain("takeoff → cuantificación");
    expect(lastPrompt).toContain("takeoff.actions.create");
  });
});
