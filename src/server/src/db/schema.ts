import { sql } from "drizzle-orm";
import { text, integer, sqliteTable } from "drizzle-orm/sqlite-core";
import { alphabet, generateRandomString } from "oslo/crypto"

const generateId = () => generateRandomString(10, alphabet("a-z", "0-9"))

export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn( generateId ),
  username: text('username').notNull(),
  password: text('password').notNull(),
  apartment: text("apartment").notNull()
});