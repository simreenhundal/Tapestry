import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const employeesTable = pgTable("employees", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  company: text("company").default(""),
  city: text("city").notNull(),
  country: text("country").notNull(),
  timezone: text("timezone").notNull().default("UTC"),
  role: text("role").default(""),
  religion: text("religion").default(""),
  culturalBackground: text("cultural_background").default(""),
  caregivingResponsibilities: text("caregiving_responsibilities").default(""),
  preferredWorkStart: text("preferred_work_start").default("09:00"),
  preferredWorkEnd: text("preferred_work_end").default("17:00"),
  preferredWorkDays: text("preferred_work_days").array().default(["Mon", "Tue", "Wed", "Thu", "Fri"]),
  healthConsiderations: text("health_considerations").default(""),
  additionalContext: text("additional_context").default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertEmployeeSchema = createInsertSchema(employeesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type Employee = typeof employeesTable.$inferSelect;
