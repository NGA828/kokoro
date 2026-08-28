import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as path from 'path';

/**
 * Database configuration.
 *
 * Production/staging targets MySQL (mysql2 driver). For zero-setup local
 * development we also support a sql.js (SQLite/WASM) driver so the whole
 * stack runs with `npm run start:dev` and no external services.
 *
 * Entities are written in a portable style (string UUID PKs, camelCase
 * columns, no DB-specific column types), which is why the same schema runs
 * on both engines.
 */

const entitiesDir = path.join(__dirname, '..');

function globEntities(): string[] {
  // Works both with ts-node (src/**/*.entity*.ts) and compiled dist.
  return [
    path.join(entitiesDir, '**', '*.entity.{ts,js}'),
    path.join(entitiesDir, '**', '*.entities.{ts,js}'),
  ];
}

export function buildTypeOrmOptions(): TypeOrmModuleOptions {
  const type = (process.env.DB_TYPE || 'sqlite').toLowerCase();

  if (type === 'mysql' || type === 'mariadb') {
    return {
      type: 'mysql',
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '3306', 10),
      username: process.env.DATABASE_USER || 'root',
      password: process.env.DATABASE_PASSWORD || '',
      database: process.env.DATABASE_NAME || 'kokoro_march',
      entities: globEntities(),
      synchronize: (process.env.DB_SYNCHRONIZE || 'true') === 'true',
      autoLoadEntities: true,
      charset: 'utf8mb4',
      timezone: 'Z',
    };
  }

  // sql.js (SQLite in WASM) — persisted to a local file.
  const location = process.env.DATABASE_SQLITE_PATH || './data/kokoro-dev.db';
  return {
    type: 'sqljs',
    location,
    autoSave: true,
    entities: globEntities(),
    synchronize: true,
    autoLoadEntities: true,
  } as TypeOrmModuleOptions;
}
