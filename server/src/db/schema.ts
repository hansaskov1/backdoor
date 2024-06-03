import { sql } from "drizzle-orm";
import { text, integer, sqliteTable, primaryKey} from "drizzle-orm/sqlite-core";
import { alphabet, generateRandomString } from "oslo/crypto"

const generateId = () => generateRandomString(10, alphabet("a-z", "0-9"))

export enum Role {
  ADMIN = 'admin',
  RESIDENT = 'resident',
  SERVICE_PERSONNEL = 'service_personnel'
}

export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn( generateId ),
  username: text('username').notNull(),
  password: text('password').notNull(),
  apartment: text("apartment").notNull(),
  role: text('role').notNull()
});

export const locks = sqliteTable('locks', {
  id: text('id').primaryKey().$defaultFn( generateId ),
  name: text('name').notNull(),
})

// many to many relation
export const UserLockTable = sqliteTable('UserLockTable', {
  user_id: text("user_id").references(() => users.id).notNull(), // foreign key
  lock_id: text("lock_id").references(() => locks.id).notNull(),
  }, 
  table => {
    return {
      pk: primaryKey({columns: [table.user_id, table.lock_id] }), // composite primary key
    }
  }
)