## Integration (e2e) Tests (complete)

**Date completed:** 2026-10-23 (API key tests added 2026-10-26)

### What was built
- `test/app.e2e-spec.ts` replaces the default NestJS sample test
- `test/api-keys.e2e-spec.ts` covers the API key and records flow
- The test apps apply the same validation pipe, exception filter and response interceptor as `main.ts`
- Each run uses a random phone number and project name so reruns do not collide

### Testing
- 9 e2e tests passing in 2 files (`npm run test:e2e`):
  - Register a user (201)
  - Log in the registered user (200)
  - Create a project as the logged-in user (201)
  - A second user is blocked from reading the first user's project (403)
  - Create an API key in the `pk_` format (201)
  - Create a record with the `x-api-key` header (201)
  - List records with the `x-api-key` header (200)
  - A request with no credentials is rejected (401)
  - After the key is revoked, the same key is rejected (401)
- 60 unit tests across 13 files passing (`npm test`)

### Next
- Optional: clean up the test users that each e2e run adds to `baas_db`
- Optional: global `/api/v1` prefix from the project PDF (changes every route and test)