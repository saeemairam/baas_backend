export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: string;
  roleId: string | null;
  createdAt: Date;
}
