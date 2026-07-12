---
title: 'Fly Server Deployment'
type: 'chore'
created: '2026-07-12'
status: 'done'
baseline_commit: '3e52d9056ee6987b6f726d08b7e807395d3bf41b'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The Node server compiles source from both `server/src` and the repository-level `shared` directory, but the repository has no Docker or Fly.io configuration. Deploying `server/` as the Fly build context would exclude `shared`, while a server-only dependency install would also omit root-owned `zod`.

**Approach:** Add a repository-root Docker build context with a server-specific multi-stage Dockerfile, a minimal Fly app configuration, and a root Docker ignore file. Build and run the server with both root and server dependencies, compile shared sources into the existing `server/dist` layout, and copy runtime mission YAML files into the final image.

## Boundaries & Constraints

**Always:** Use Yarn and frozen lockfiles. Keep `server/tsconfig.json` and its existing `rootDir`, `outDir`, and shared include behavior unchanged. Build from the repository root while locating the Dockerfile at `server/Dockerfile`. Install root dependencies so shared source can resolve `zod`, and install server dependencies for the API. Use a multi-stage Node 22 image, production-only runtime dependencies, `NODE_ENV=production`, port 4000, a non-root runtime user, and the existing `node dist/server/src/index.js` entry point. Copy `server/missions` to `/app/server/missions` because startup reads it from the process working directory. Configure the initial Fly app name as `project-mafia-server`, region `iad`, HTTPS, and automatic machine start/stop.

**Ask First:** Stop before changing the server build layout, package manifests, application code, port, region, Fly process model, or machine sizing beyond the agreed 512 MB shared-CPU default. If the configured Fly app name is unavailable, report it rather than choosing another external name.

**Never:** Put Firebase, OpenAI, CORS, or cron secrets in committed files. Do not deploy, create, rename, or mutate a Fly app. Do not use npm, buildpacks, a server-only Docker context, copy client sources into the image, add dependencies, refactor into workspaces, or start a long-running local server.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Repository-root image build | Docker receives `.` with `server/Dockerfile` | Build can copy `shared`, compile server and shared output, and create a production image | Frozen installs or TypeScript compilation fail the build immediately |
| Runtime startup | Image has required Fly secrets and port 4000 | Process starts from `/app/server`, loads mission YAML, and runs the compiled API as the Node user | Existing environment validation or missing-mission errors fail startup visibly |
| Incorrect subdirectory deployment | Operator uses `fly deploy server` | Documented deployment command avoids this state by explicitly passing `.` | Docker cannot access `shared`; do not weaken COPY paths to hide the error |
| Local tooling unavailable | Docker or `flyctl` is absent | Static checks and server verification still run | Report skipped Docker/Fly validation without claiming it passed |

</frozen-after-approval>

## Code Map

- `package.json` and `yarn.lock` -- root-owned `zod` dependency required while compiling shared source.
- `server/package.json` and `server/yarn.lock` -- server build scripts and API dependencies.
- `server/tsconfig.json` -- compiles `server/src` and `../shared` into `server/dist`.
- `server/src/config/env.ts` -- runtime environment contract and port default.
- `server/src/services/MissionTemplateService.ts` and `server/src/services/EngineConfigService.ts` -- runtime reads from `server/missions`.
- `server/Dockerfile` -- new root-context, multi-stage server image definition.
- `server/fly.toml` -- new Fly build and HTTP service configuration.
- `.dockerignore` -- new root build-context exclusions.

## Tasks & Acceptance

**Execution:**
- [x] `.dockerignore` -- exclude repository metadata, dependencies, build output, local secrets, client sources, and agent artifacts while retaining server/shared inputs.
- [x] `server/Dockerfile` -- install root and server dependency graphs, compile the existing TypeScript layout, and produce a minimal non-root runtime image containing compiled output and mission YAML.
- [x] `server/fly.toml` -- point Fly at the server Dockerfile while preserving repository-root context and configure the port-4000 HTTP service.

**Acceptance Criteria:**
- Given the repository root as Docker context, when the server image builds, then `server/src` and `shared` compile successfully with frozen Yarn installs.
- Given the final image, when its filesystem and command are inspected, then it contains production root/server dependencies, `server/dist`, and `server/missions`, and starts as the Node user.
- Given `fly deploy . --config server/fly.toml`, when Fly resolves the build, then it uses `server/Dockerfile` without excluding `shared` from context.
- Given the committed configuration, when secrets are audited, then no Firebase, OpenAI, CORS, or cron credential value is present.

## Spec Change Log

## Design Notes

Root and server installs are intentionally separate because the repository is not a Yarn workspace: shared source resolves `zod` upward from `/app/shared` during compilation, while compiled server code resolves runtime dependencies from `/app/server/node_modules` and then `/app/node_modules`. The root `.dockerignore` keeps the required root-context build small without changing project structure.

## Verification

**Commands:**
- `yarn --cwd server build` -- expected: existing server and shared TypeScript compile successfully.
- `yarn --cwd server typecheck` -- expected: no TypeScript errors.
- `yarn --cwd server test` -- expected: all server tests pass.
- `docker build -f server/Dockerfile -t project-mafia-server .` -- expected: production image builds when Docker is available.
- `fly config validate --config server/fly.toml` -- expected: Fly configuration validates when `flyctl` is available.
- `git diff --check` -- expected: no malformed configuration whitespace.

## Suggested Review Order

**Container build**

- Root-context build installs both dependency graphs before compiling shared and server sources.
  [`Dockerfile:1`](../../server/Dockerfile#L1)

- Runtime keeps production dependencies, mission YAML, and the existing non-root entry point.
  [`Dockerfile:18`](../../server/Dockerfile#L18)

**Fly orchestration**

- Fly selects the nested Dockerfile while preserving repository-root build context.
  [`fly.toml:8`](../../server/fly.toml#L8)

- Readiness checks prevent routing traffic when Firestore-backed health degrades.
  [`fly.toml:22`](../../server/fly.toml#L22)

**Build-context hygiene**

- Exclusions keep dependencies, secrets, clients, and agent artifacts off the builder.
  [`.dockerignore:1`](../../.dockerignore#L1)
