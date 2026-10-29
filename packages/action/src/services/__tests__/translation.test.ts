import { describe, expect, test } from "bun:test";
import { assertTranslationSucceeded } from "../translation.ts";

describe("assertTranslationSucceeded", () => {
  test("passes a clean run", () => {
    expect(() => assertTranslationSucceeded(0, "")).not.toThrow();
  });

  test("fails a non-zero exit", () => {
    expect(() => assertTranslationSucceeded(1, "")).toThrow("exit code 1");
  });

  test("fails when the CLI reports a locale error despite exit 0", () => {
    expect(() =>
      assertTranslationSucceeded(0, "Error translating es: connection refused\n"),
    ).toThrow("not committing");
  });
});
