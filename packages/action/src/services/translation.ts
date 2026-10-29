import type { Config } from "../utils/config.ts";
import { logger } from "../utils/logger.ts";

interface ExecError extends Error {
  stderr?: string;
}

export class TranslationService {
  #getCliCommand(cliVersion = "latest") {
    return `languine@${cliVersion}`;
  }

  async runTranslation(config: Config) {
    try {
      const { apiKey, baseUrl, projectId, cliVersion } = config;

      const cliCommand = this.#getCliCommand(cliVersion);

      logger.debug(`CLI Command: bun x ${cliCommand}`);
      logger.debug(`Base URL: ${baseUrl}`);
      logger.debug(`Project ID: ${projectId}`);
      logger.debug(`CLI Version: ${cliVersion}`);
      logger.debug(`Working Directory: ${process.cwd()}`);

      // Pipe stderr so we can see "Error translating …": the CLI still exits 0
      // (and updates languine.lock) when a locale fails, so commit nothing then.
      const proc = Bun.spawn(
        [
          "bunx",
          cliCommand,
          "translate",
          "--project-id",
          projectId,
          "--api-key",
          apiKey,
        ],
        {
          stdout: "inherit",
          stderr: "pipe",
          env: {
            ...process.env,
            LANGUINE_BASE_URL: baseUrl,
            LANGUINE_API_KEY: apiKey,
          },
        },
      );

      const stderr = await new Response(proc.stderr).text();
      process.stderr.write(stderr);
      const exitCode = await proc.exited;

      assertTranslationSucceeded(exitCode, stderr);
    } catch (error) {
      logger.error(`Translation process failed: ${error}`);
      throw error;
    }
  }
}

export function assertTranslationSucceeded(exitCode: number, stderr: string) {
  if (exitCode !== 0) {
    throw new Error(`Process failed with exit code ${exitCode}`);
  }
  if (stderr.includes("Error translating")) {
    throw new Error("Languine reported translation errors; not committing.");
  }
}
