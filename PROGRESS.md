# BaaS Backend - Progress Log

## Step 5: Roles and Permissions (complete)

**Date completed:** 2026-10-09

### What was built
- Database tables: `roles`, `permissions`, `role_permissions` (migration 004)
- 12 seeded permissions (migration 005)
- `project_members.role_id` foreign key to `roles` (migration 006)
- Four default roles created for every new project: owner, admin, developer, viewer
- `RolesService` and `RolesRepository` (role lookup, permission lookup per user)
- `@RequirePermissions` decorator and `PermissionsGuard`, attached to the project-members endpoints
- Old `project_members.role` column removed (migration 007); the member role name is now read from the `roles` table through `role_id`

### Testing
- 35 unit tests passing (Vitest)
- Swagger two-user tests passed:
  - Viewer can read the members list (200)
  - Viewer cannot add a member (403)
  - Viewer cannot remove a member (403)
  - Owner can add a member (201)
  - Owner can remove a member (200)
  - Removing the project owner is blocked (403)

### Next

## Step 6: API Keys (complete)

**Date completed:** 2026-10-09

### What was built
- `api_keys` table (migration 008)
- Permissions `api_keys:read`, `api_keys:create`, `api_keys:delete` (migration 009)
- Permissions assigned to existing roles: owner and admin get all three, developer gets read only (migration 010)
- `src/api-keys/` module: entity, DTO, repository, service, controller, module
- Public keys only, format `pk_` + 48 hex characters; only the SHA-256 hash is stored, the full key is shown once at creation
- Default roles constant updated with the api_keys permissions
- Revoking an unknown key id returns 404

### Testing
- 40 unit tests passing (Vitest), including the ApiKeysService tests and the 404 on revoking an unknown key
- Swagger tests passed:
  - Owner can create a key (201), key returned once
  - Owner can list keys (200), only `keyPrefix` shown
  - Owner can revoke a key (200), `revoked_at` confirmed in MySQL
  - Viewer cannot create a key (403)
  - Viewer cannot list keys (403)

### Next
- Step 7: Resources and records

## Step 7: Resources and Records (complete)

### What was built
- Resources endpoints: `/projects/:projectId/resources`
- JSON records endpoints: `/projects/:projectId/resources/:resourceId/records`
- Pagination, filtering and sorting on records

## Step 8: Audit Logs (complete, one check pending)

### What was built
- `audit_logs` table (migration 014)
- `audit_logs:read` permission (migration 015)
- `GET /projects/:projectId/audit-logs`
- `AuditLogsService.log()` never throws, so a logging failure cannot break a request
- Audit entries are written by:
  - Resources controller: `resource.created`, `resource.deleted`
  - Records controller: `record.created`, `record.updated`, `record.deleted`
  - API keys controller: `api_key.created` (logs only the name and `keyPrefix`, never the full key), `api_key.revoked`

### Testing
- AuditLogsService unit tests added and passing
- `record.created` tested in Swagger
- Pending: `record.updated` and `record.deleted` entries are not yet tested in Swagger

## Rate Limiting (complete)

### What was built
- `@nestjs/throttler` ^6.7.1
- Global limit of 100 requests per 60 seconds (`ThrottlerModule.forRoot` plus `ThrottlerGuard` as `APP_GUARD`)
- `POST /auth/login` limited to 5 attempts per 60 seconds

### Testing
- `x-ratelimit-*` headers confirmed in Swagger
- The 6th rapid login attempt returned 429

## Step 10: Security Headers with Helmet (complete)

**Date completed:** 2026-10-23

### What was built
- `helmet` installed and applied with `app.use(helmet())` in `src/main.ts`

### Testing
- Swagger UI at `/api/docs` still loads
- Response headers confirmed, including `x-content-type-options: nosniff`, `x-frame-options`, `strict-transport-security` and `content-security-policy`

## Integration (e2e) Tests (complete)

**Date completed:** 2026-10-23

### What was built
- `test/app.e2e-spec.ts` replaces the default NestJS sample test
- The test app applies the same validation pipe, exception filter and response interceptor as `main.ts`
- Each run uses a random phone number and project name so reruns do not collide

### Testing
- 4 e2e tests passing (`npm run test:e2e`):
  - Register a user (201)
  - Log in the registered user (200)
  - Create a project as the logged-in user (201)
  - A second user is blocked from reading the first user's project (403)
- 60 unit tests across 13 files passing (`npm test`)

### Next
- Optional: test `record.updated` and `record.deleted` audit entries in Swagger
- Optional: clean up the test users that each e2e run adds to `baas_db`
- Optional: global `/api/v1` prefix from the project PDF (changes every route and test)