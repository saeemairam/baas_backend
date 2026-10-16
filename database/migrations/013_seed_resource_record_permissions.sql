INSERT INTO permissions (id, name, resource, action) VALUES
  (UUID(), 'resources:read', 'resources', 'read'),
  (UUID(), 'resources:create', 'resources', 'create'),
  (UUID(), 'resources:delete', 'resources', 'delete');

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE p.resource = 'resources'
  AND (
    r.name IN ('owner', 'admin')
    OR (r.name IN ('developer', 'viewer') AND p.name = 'resources:read')
  );