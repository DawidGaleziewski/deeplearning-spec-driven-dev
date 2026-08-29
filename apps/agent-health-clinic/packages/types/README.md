# @clinic/types

The HTTP contract shared by the NestJS API (`../../api`) and the Next.js
frontend (`../../frontend`) — request bodies and response shapes, types only.

- **No runtime code.** Interfaces and `type` aliases exclusively, so both
  `nest build` and `next build` consume it without bundling anything.
- The API's `class-validator` DTOs `implement` the `*Body` types; the
  frontend's `src/lib/api.ts` imports the `*Response` types. A field change
  here is a compile error on whichever side falls out of sync.

## Consuming it

Both apps depend on it with a `file:` specifier:

```jsonc
// api/package.json and frontend/package.json
"dependencies": { "@clinic/types": "file:../packages/types" }
```

`npm install` in each app symlinks this directory into its `node_modules`.
The compiled output in `dist/` is committed so a fresh `npm install` resolves
the types with no extra build step. If you edit `src/index.ts`, rebuild:

```bash
cd packages/types && npm run build
```

(`npm install` inside this package also rebuilds via the `prepare` script.)

The frontend lists this package in `transpilePackages` in `next.config.ts` so
its published entry points resolve cleanly through the Next bundler.
