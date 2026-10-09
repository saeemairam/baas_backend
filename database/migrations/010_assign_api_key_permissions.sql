USE baas_db;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.resource = 'api_keys'
WHERE r.name IN ('owner', 'admin')
   OR (r.name = 'developer' AND p.name = 'api_keys:read');