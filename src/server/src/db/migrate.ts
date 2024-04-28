import { migrate } from "drizzle-orm/bun-sqlite/migrator"
import { db } from "./sqlite";

migrate(db, { migrationsFolder: "drizzle" });