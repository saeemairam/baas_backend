export interface ApiKey {
  id: string;
  projectId: string;
  name: string;
  keyPrefix: string;
  createdAt: Date;
  revokedAt: Date | null;
}
