USE baas_db;

INSERT INTO permissions (id, name, resource, action) VALUES
  (UUID(), 'projects:read',    'projects', 'read'),
  (UUID(), 'projects:update',  'projects', 'update'),
  (UUID(), 'projects:delete',  'projects', 'delete'),
  (UUID(), 'members:read',     'members',  'read'),
  (UUID(), 'members:create',   'members',  'create'),
  (UUID(), 'members:delete',   'members',  'delete'),
  (UUID(), 'users:read',       'users',    'read'),
  (UUID(), 'users:update',     'users',    'update'),
  (UUID(), 'records:read',     'records',  'read'),
  (UUID(), 'records:create',   'records',  'create'),
  (UUID(), 'records:update',   'records',  'update'),
  (UUID(), 'records:delete',   'records',  'delete');