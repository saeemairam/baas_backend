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
- Step 6: API keys