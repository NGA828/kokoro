import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { buildTypeOrmOptions } from '../config/data-source';
import { InitialSchema1700000000000 } from './migrations/1700000000000-InitialSchema';

async function run() {
  const opts = buildTypeOrmOptions() as Record<string, unknown>;
  const ds = new DataSource({
    ...opts,
    synchronize: false,
    migrationsRun: false,
    migrations: [InitialSchema1700000000000],
  } as never);
  await ds.initialize();
  await ds.runMigrations();
  console.log('✅ Migrations complete.');
  await ds.destroy();
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
