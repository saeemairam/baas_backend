# BaaS Backend - Progress Log

## Step 1: Project Setup (complete)

### What was built
- NestJS project (TypeScript, ESM) with Swagger at `/api/docs`
- MySQL database `baas_db` with a `mysql2` connection pool (native SQL, no ORM)
- `DatabaseService` with `query<T>(sql, params)` for parameterized queries
- Global response interceptor and exception filter: success `{ success, message, data }`, errors `{ success: false, error: { code, message } }`
- Global validation pipe returning 422 on validation errors
- Decision: the global `/api/v1` prefix from the PDF was skipped, so routes have no prefix

## Step 2: Users and Registration (complete)

### What was built
- Users module: entity, DTO, repository, service
- `POST /auth/register` (phone, password, first name, last name)
- Duplicate phone returns 409

## Step 3: Authentication (complete)

### What was built
- `POST /auth/login` returns an access token and a refresh token (JWT)
- `POST /auth/refresh` issues a new access token from a refresh token
- `POST /auth/logout` (stub: does not revoke tokens server-side, the client discards its tokens)
- `GET /auth/me` returns the current user, protected by `JwtAuthGuard`

## Step 4: Projects and Members (complete)

### What was built
- Projects CRUD: `POST/GET/PATCH/DELETE /projects` with ownership checks (403 for projects you do not own, 404 if not found)
- Unique project slug (409 on duplicates)
- Project members endpoints

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

## Step 7: Resources and Records (complete)

### What was built
- `resources` table (migration 011) and `records` table with a JSON `data` column (migration 012)
- `resources:*` permissions added and assigned to the default roles (migration 013)
- Resources endpoints: `/projects/:projectId/resources` (create, list, delete a resource and its records)
- JSON records endpoints: `/projects/:projectId/resources/:resourceId/records`
- Every query includes the project ID, so one project cannot read another project's data

### Testing
- Unit tests added for the resources and records services
- Swagger: created a resource, listed resources (200), created a record (201), and confirmed it appears in the records list (2026-10-23)

## Step 8: Audit Logs (complete)

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
- `record.created`, `record.updated` and `record.deleted` entries all confirmed in Swagger through `GET /projects/:projectId/audit-logs` (2026-10-23)

## Step 9: Rate Limiting (complete)

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

## API Key Authentication on Records (complete)

**Date completed:** 2026-10-23

### What was built
- `api-key-or-jwt.guard.ts`: the records endpoints accept either a bearer token or an `x-api-key` header
- Migration 016 adds a `last_used_at` column to `api_keys`
- `main.ts` adds an `api-key` authorization (`x-api-key` header) to Swagger

### Testing
- Swagger, with only the `x-api-key` header and no bearer token:
  - An active key reads records (200)
  - After the key was revoked, the same request returns 401 "Invalid API key"

## Forgot Password with OTP (complete)

**Date completed:** 2026-10-27

### What was built
- `password_reset_codes` table (migration 017): stores a SHA-256 hash of the code, expiry, attempt count and used time
- `POST /auth/forgot-password`: always answers the same way, so it does not reveal which phones are registered; limited to 3 requests per 60 seconds
- `POST /auth/reset-password`: checks the code and sets the new password (bcrypt, same as registration); limited to 5 attempts per 60 seconds
- Rules: a 6-digit code, valid for 5 minutes, usable once, cancelled after 3 wrong attempts, and a new request cancels older codes
- `UsersService.setPassword` and `UsersRepository.updatePassword` added
- Development mode: the code is printed in the server terminal and never printed when `NODE_ENV` is `production`

### Testing
- 66 unit tests across 14 files passing at the time of completion, including 6 for `PasswordResetService`
- Swagger tests passed:
  - Request a code (200) and see it in the terminal
  - Reset with the code (200)
  - Login with the new password (200)
  - Login with the old password (401)
  - Reuse the same code (400)

### Next
- No SMS provider is connected yet, so the code only appears in the server terminal; a provider such as MSG91 or Twilio would replace the terminal log in `PasswordResetService.requestReset`

## Per-Project Databases (complete)

**Date completed:** 2026-10-29

### What was built
- Migration 018 adds a nullable `database_name` column to `projects`
- Each newly created project gets its own MySQL database named `proj_<project UUID without dashes>`
- `ProjectDatabasesModule` and `ProjectDatabasesService` provision the project database and create its `resources` and `records` tables
- The generated database name is validated before use
- Resources and records repositories route project-specific queries to the corresponding project database
- Existing projects with `database_name = NULL` continue using the legacy `baas_db` database
- Project database connection pools are reused and closed when the service is destroyed
- Project creation provisions its database; if provisioning fails, the project creation is rolled back
- Project database cleanup is handled when a project is deleted
- Migration 019 changes the `project_members` foreign key to `ON DELETE CASCADE` so project deletion can remove its members

### Testing
- Project database creation and tables confirmed in MySQL Workbench
- Resource data confirmed in the correct project database rather than `baas_db`
- Project deletion returned 200 in Swagger
- Project database service tests pass, including database-name validation, provisioning, legacy-project fallback, pool reuse, missing-project handling and cleanup
- Projects, resources and records service tests pass
- Latest unit test run: **79 tests passed across 15 test files** (`npx vitest run`)
- Latest end-to-end test run: **9 tests passed across 2 test files** (`npm run test:e2e`)

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

### Latest test status
- **79 unit tests passed across 15 files** (`npx vitest run`)
- **9 end-to-end tests passed across 2 files** (`npm run test:e2e`)
- Total: **88 tests passed**

### Next
- Optional: clean up the test users that each e2e run adds to `baas_db`
- Optional: add the global `/api/v1` prefix from the project PDF (changes every route and test)
- Before pushing: confirm the end-to-end coverage includes creating a record in a newly provisioned project database and verify that old projects with `database_name = NULL` still use `baas_db`
