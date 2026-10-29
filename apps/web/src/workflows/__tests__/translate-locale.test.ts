import { describe, expect, mock, test } from "bun:test";

const events: Array<{ type: string; message?: string }> = [];

mock.module("workflow", () => ({
  getWritable: () => ({
    getWriter: () => ({
      write: async (event: { type: string; message?: string }) => {
        events.push(event);
      },
      releaseLock: () => {},
    }),
  }),
}));

// Any step failing must surface; the settings lookup is the first step to run.
mock.module("../../db/queries/project", () => ({
  getProjectById: async () => {
    throw new Error("connection refused");
  },
}));

mock.module("../../db/queries/translate", () => ({
  createTranslations: async () => [],
  createDocument: async () => [],
}));

describe("translateLocale", () => {
  test("emits an error event when a step fails", async () => {
    const { translateLocale } = await import("../translate-locale");

    await expect(
      translateLocale({
        projectId: "prj_1",
        sourceFormat: "json",
        sourceLanguage: "en",
        targetLocale: "es",
        content: [{ key: "a", sourceText: "Down", sourceFile: "en.json" }],
      }),
    ).rejects.toThrow("connection refused");

    expect(events.at(-1)).toEqual({
      type: "error",
      targetLocale: "es",
      message: "connection refused",
    });
  });
});
