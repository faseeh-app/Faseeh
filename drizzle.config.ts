import 'dotenv/config'
import { Config, defineConfig } from 'drizzle-kit'

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema.ts',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.DB_FILE_NAME!
  },
  verbose: true,
  strict: true
} satisfies Config)
