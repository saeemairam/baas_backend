import { Injectable } from '@nestjs/common';

const DATABASE_NAME_PATTERN = /^proj_[0-9a-f]{32}$/;

@Injectable()
export class ProjectDatabasesService {
  /** Builds the database name for a project id: proj_ + id without dashes. */
  buildDatabaseName(projectId: string): string {
    const name = `proj_${projectId.replace(/-/g, '').toLowerCase()}`;
    this.assertValidDatabaseName(name);
    return name;
  }

  /** Throws unless the name is proj_ followed by exactly 32 hex characters. */
  assertValidDatabaseName(name: string): void {
    if (!DATABASE_NAME_PATTERN.test(name)) {
      throw new Error('Invalid project database name');
    }
  }
}
