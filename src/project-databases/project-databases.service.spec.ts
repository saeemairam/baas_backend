import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('mysql2/promise', () => ({ createPool: vi.fn() }));

import { createPool } from 'mysql2/promise';
import { ProjectDatabasesService } from './project-databases.service.js';

const PROJECT_ID = 'de92c856-5367-43ad-b5a1-ebeb09aef982';
const DB_NAME = 'proj_de92c856536743adb5a1ebeb09aef982';
const LOOKUP_SQL = 'SELECT database_name FROM projects WHERE id = ?';

describe('ProjectDatabasesService', () => {
  let databaseService: { query: ReturnType<typeof vi.fn> };
  let configService: { get: ReturnType<typeof vi.fn> };
  let pool: {
    execute: ReturnType<typeof vi.fn>;
    end: ReturnType<typeof vi.fn>;
  };
  let service: ProjectDatabasesService;

  const lookups = () =>
    databaseService.query.mock.calls.filter((c) => c[0] === LOOKUP_SQL).length;

  beforeEach(() => {
    databaseService = { query: vi.fn() };
    configService = { get: vi.fn().mockReturnValue('3306') };
    pool = {
      execute: vi.fn().mockResolvedValue([[{ id: 1 }], []]),
      end: vi.fn().mockResolvedValue(undefined),
    };

    vi.mocked(createPool).mockReset();
    vi.mocked(createPool).mockReturnValue(pool as any);

    service = new ProjectDatabasesService(
      databaseService as any,
      configService as any,
    );
  });

  describe('buildDatabaseName', () => {
    it('returns proj_ plus the id without dashes', () => {
      expect(service.buildDatabaseName(PROJECT_ID)).toBe(DB_NAME);
    });

    it('lowercases the id', () => {
      expect(service.buildDatabaseName(PROJECT_ID.toUpperCase())).toBe(DB_NAME);
    });

    it('throws for an id that is not a valid uuid', () => {
      expect(() => service.buildDatabaseName('not-a-uuid')).toThrow(
        'Invalid project database name',
      );
    });
  });

  describe('assertValidDatabaseName', () => {
    it('accepts a valid name', () => {
      expect(() => service.assertValidDatabaseName(DB_NAME)).not.toThrow();
    });

    it('rejects baas_db and injection attempts', () => {
      expect(() => service.assertValidDatabaseName('baas_db')).toThrow();

      expect(() =>
        service.assertValidDatabaseName('proj_x`; DROP DATABASE baas_db; --'),
      ).toThrow();
    });
  });

  describe('provision', () => {
    it('creates the database and tables, saves the name and returns it', async () => {
      databaseService.query.mockResolvedValue([]);

      const name = await service.provision(PROJECT_ID);

      expect(name).toBe(DB_NAME);
      expect(databaseService.query).toHaveBeenCalledTimes(4);

      expect(databaseService.query.mock.calls[0][0]).toContain(
        'CREATE DATABASE IF NOT EXISTS `' + DB_NAME + '`',
      );

      // FIX: Include the backticks around the database name.
      expect(databaseService.query.mock.calls[1][0]).toContain(
        `\`${DB_NAME}\`.resources`,
      );

      expect(databaseService.query.mock.calls[2][0]).toContain(
        `\`${DB_NAME}\`.records`,
      );

      expect(databaseService.query).toHaveBeenLastCalledWith(
        'UPDATE projects SET database_name = ? WHERE id = ?',
        [DB_NAME, PROJECT_ID],
      );
    });
  });

  describe('query', () => {
    it('uses baas_db for old projects (database_name NULL)', async () => {
      databaseService.query
        .mockResolvedValueOnce([{ database_name: null }])
        .mockResolvedValueOnce(['row']);

      const result = await service.query(PROJECT_ID, 'SELECT 1', [1]);

      expect(result).toEqual(['row']);
      expect(databaseService.query).toHaveBeenLastCalledWith('SELECT 1', [1]);
      expect(createPool).not.toHaveBeenCalled();
    });

    it('uses the project pool for new projects', async () => {
      databaseService.query.mockResolvedValueOnce([{ database_name: DB_NAME }]);

      const result = await service.query(PROJECT_ID, 'SELECT 1', [1]);

      expect(result).toEqual([{ id: 1 }]);

      expect(createPool).toHaveBeenCalledWith(
        expect.objectContaining({
          database: DB_NAME,
          connectionLimit: 3,
        }),
      );

      expect(pool.execute).toHaveBeenCalledWith('SELECT 1', [1]);
    });

    it('reuses the pool and the cached name on the second call', async () => {
      databaseService.query.mockResolvedValueOnce([{ database_name: DB_NAME }]);

      await service.query(PROJECT_ID, 'SELECT 1');
      await service.query(PROJECT_ID, 'SELECT 2');

      expect(createPool).toHaveBeenCalledTimes(1);
      expect(lookups()).toBe(1);
    });

    it('throws NotFoundException when the project does not exist', async () => {
      databaseService.query.mockResolvedValueOnce([]);

      await expect(
        service.query(PROJECT_ID, 'SELECT 1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('drop', () => {
    it('skips old projects', async () => {
      databaseService.query.mockResolvedValueOnce([{ database_name: null }]);

      await service.drop(PROJECT_ID);

      expect(databaseService.query).toHaveBeenCalledTimes(1);
      expect(pool.end).not.toHaveBeenCalled();
    });

    it('closes the pool, drops the database and clears the name cache', async () => {
      databaseService.query.mockResolvedValueOnce([{ database_name: DB_NAME }]);
      databaseService.query.mockResolvedValue([]);

      await service.query(PROJECT_ID, 'SELECT 1');

      expect(lookups()).toBe(1);

      await service.drop(PROJECT_ID);

      expect(pool.end).toHaveBeenCalledTimes(1);

      expect(databaseService.query).toHaveBeenLastCalledWith(
        'DROP DATABASE IF EXISTS `' + DB_NAME + '`',
      );

      // Cache was cleared, so the next call looks the project up again.
      databaseService.query.mockResolvedValueOnce([{ database_name: null }]);

      await service.query(PROJECT_ID, 'SELECT 1');

      expect(lookups()).toBe(2);
    });
  });

  describe('onModuleDestroy', () => {
    it('closes every project pool', async () => {
      databaseService.query.mockResolvedValueOnce([{ database_name: DB_NAME }]);

      await service.query(PROJECT_ID, 'SELECT 1');
      await service.onModuleDestroy();

      expect(pool.end).toHaveBeenCalledTimes(1);
    });
  });
});
