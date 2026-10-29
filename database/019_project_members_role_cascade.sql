USE baas_db;

ALTER TABLE project_members
  DROP FOREIGN KEY fk_project_members_role;

ALTER TABLE project_members
  ADD CONSTRAINT fk_project_members_role
  FOREIGN KEY (role_id) REFERENCES roles (id)
  ON DELETE CASCADE;