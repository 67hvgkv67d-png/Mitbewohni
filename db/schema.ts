import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const profiles = sqliteTable("profiles", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  age: integer("age").notNull(),
  gender: text("gender").notNull(),
  city: text("city").notNull(),
  district: text("district").notNull().default(""),
  moveIn: text("move_in").notNull().default(""),
  housing: text("housing").notNull().default("Ich suche eine Wohnung"),
  about: text("about").notNull(),
  lookingFor: text("looking_for").notNull(),
  preferredGender: text("preferred_gender").notNull().default("Alle"),
  dislikes: text("dislikes").notNull().default(""),
  important: text("important").notNull().default(""),
  accessibility: text("accessibility").notNull().default(""),
  contactName: text("contact_name").notNull(),
  contactType: text("contact_type").notNull(),
  contactValue: text("contact_value").notNull(),
  imageKey: text("image_key"),
  createdAt: text("created_at").notNull(),
}, (table) => [
  index("idx_profiles_city").on(table.city),
  index("idx_profiles_gender").on(table.gender),
]);
