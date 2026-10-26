import { defineConfig } from 'drizzle-kit';

// `npm run db:generate` compares these schema files with the last migration
// and writes the SQL for what changed into api/migrations.
export default defineConfig({
  dialect: 'postgresql',
  schema: ['./api/schema.js', './api/modules/*/schema.js'],
  out: './api/migrations',
});
