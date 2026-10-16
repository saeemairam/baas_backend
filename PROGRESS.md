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

### Testing
- 39 unit tests passing (Vitest), including 4 new ApiKeysService tests
- Swagger tests passed:
  - Owner can create a key (201), key returned once
  - Owner can list keys (200), only `keyPrefix` shown
  - Owner can revoke a key (200), `revoked_at` confirmed in MySQL
  - Viewer cannot create a key (403)
  - Viewer cannot list keys (403)

### Next
- Step 7: Resources and records