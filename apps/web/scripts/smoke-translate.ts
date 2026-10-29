// Live check of a deployment against the real model: POSTs a few strings to
// /api/translate and prints each result. Exits 1 if any request fails.
//
//   LANGUINE_BASE_URL=https://… LANGUINE_API_KEY=… \
//     bun run scripts/smoke-translate.ts <projectId> [targetLocale]
//
// Preview deployments behind Vercel Authentication also need
// VERCEL_AUTOMATION_BYPASS_SECRET (Project → Settings → Deployment Protection).

const [projectId, targetLocale = "es"] = process.argv.slice(2);
const baseUrl = process.env.LANGUINE_BASE_URL;
const apiKey = process.env.LANGUINE_API_KEY;

if (!projectId || !baseUrl || !apiKey) {
  console.error(
    "Usage: LANGUINE_BASE_URL=… LANGUINE_API_KEY=… bun run scripts/smoke-translate.ts <projectId> [targetLocale]",
  );
  process.exit(1);
}

const samples = ["New takeoff", "Takeoff created", "Down", "Archived"];

const headers: Record<string, string> = {
  "content-type": "application/json",
  "x-api-key": apiKey,
};
const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
if (bypass) headers["x-vercel-protection-bypass"] = bypass;

let failed = false;

for (const sourceText of samples) {
  const res = await fetch(`${baseUrl}/api/translate`, {
    method: "POST",
    headers,
    body: JSON.stringify({ projectId, sourceLocale: "en", targetLocale, sourceText }),
  });
  const body = await res.text();
  console.log(`${res.status}  ${sourceText}  →  ${body}`);
  if (!res.ok) failed = true;
}

process.exit(failed ? 1 : 0);

export {};
