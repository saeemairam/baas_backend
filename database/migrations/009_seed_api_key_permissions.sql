USE baas_db;

INSERT INTO permissions (id, name, resource, action) VALUES
  (UUID(), 'api_keys:read',   'api_keys', 'read'),
  (UUID(), 'api_keys:create', 'api_keys', 'create'),
  (UUID(), 'api_keys:delete', 'api_keys', 'delete');