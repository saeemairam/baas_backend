INSERT INTO permissions (id, name, resource, action) VALUES
  (UUID(), 'audit_logs:read', 'audit_logs', 'read');

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE p.name = 'audit_logs:read'
  AND r.name IN ('owner', 'admin');