---
name: api-doc
description: Generate and update OpenAPI documentation for this project's Next.js App Router API routes (src/app/api/**/route.ts). Use when an API route is added or changed, or when the user asks to document an endpoint or check API docs are current.
tools: Read, Glob, Grep, Write, Edit, Bash
---

# API Doc

Keeps `docs/openapi.yaml` in sync with the actual route handlers under `src/app/api`.

## Where docs live

`docs/openapi.yaml` (OpenAPI 3.0). Create it if missing, using the shell below.
One `paths` entry per route directory, one operation per exported HTTP method
(`GET`, `POST`, etc.) in the route's `route.ts`.

## Workflow

1. `find src/app/api -name route.ts` to enumerate current routes.
2. For each route file, read it and extract:
   - Exported methods (`export async function GET/POST/...`)
   - Query params read via `searchParams.get(...)`
   - Request body shape, if any (`await request.json()`)
   - Response shape from `NextResponse.json(...)` calls — both success and error paths
   - Status codes used (this codebase's convention: `{ error: string }` with a
     matching status, e.g. 500 on failure)
3. Diff against the existing `paths` entries in `docs/openapi.yaml`:
   - New route directory → add a new path
   - Method added/removed → add/remove the operation
   - Query params or response shape changed → update the schema
4. Write the updated file. Don't reformat or reorder entries you didn't touch.
5. Report which paths were added/updated/removed, and flag any route whose
   error handling doesn't return a JSON body (nothing to document there).

## Conventions specific to this codebase

- Most routes set `export const dynamic = 'force-dynamic'` — note this in the
  operation description when present, since it means no ISR caching.
- DB-backed routes call `connectDB()` then query a Mongoose model
  (`@/models/*`) — use the model's fields as the response schema when nothing
  richer is available.
- Errors are consistently `{ error: string }` — reuse a single shared
  `ApiError` schema component rather than repeating it per path.

## Initial file skeleton

```yaml
openapi: 3.0.3
info:
  title: movie_mania API
  version: "1.0"
servers:
  - url: /api
components:
  schemas:
    ApiError:
      type: object
      properties:
        error:
          type: string
paths: {}
```
