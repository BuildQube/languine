FROM oven/bun:1

RUN apt-get update \
  && apt-get install -y --no-install-recommends git \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /action

# GitHub builds a Docker action with the build context set to the directory
# that contains the Dockerfile (here: packages/action), so the paths below are
# relative to packages/action -- NOT the repo root. The action has no workspace
# dependencies, so it installs stand-alone from its own package.json (no
# monorepo lockfile needed). Copy the manifest first so the install layer is
# cached independently of source changes.
COPY package.json tsconfig.json ./
RUN bun install --production

COPY src ./src

ENTRYPOINT ["bun", "run", "/action/src/index.ts"]
