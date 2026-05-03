// id,fname,lname,email,is_verified,password,created_at,updated_at

import {
  pgTable,
  integer,
  boolean,
  text,
  varchar,
  uuid,
  timestamp,
} from "drizzle-orm/pg-core";

const userTable = pgTable("users", {
  id: uuid().primaryKey().defaultRandom(),
  firstName: varchar({ length: 255 }).notNull(),
  lastName: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  isVerified: boolean().default(false),
  password: text().notNull(),
  role: varchar({ length: 255 }).notNull().default("USER"),
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp()
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export default userTable;
