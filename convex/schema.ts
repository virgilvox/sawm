import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  profiles: defineTable({
    userId: v.id("users"),
    displayName: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
  }).index("by_user", ["userId"]),

  fasting_logs: defineTable({
    userId: v.id("users"),
    date: v.string(),
    completed: v.boolean(),
    suhoorTime: v.optional(v.string()),
    iftarTime: v.optional(v.string()),
    notes: v.optional(v.string()),
  }).index("by_user_date", ["userId", "date"]),

  prayer_logs: defineTable({
    userId: v.id("users"),
    date: v.string(),
    fajr: v.boolean(),
    dhuhr: v.boolean(),
    asr: v.boolean(),
    maghrib: v.boolean(),
    isha: v.boolean(),
    taraweeh: v.boolean(),
  }).index("by_user_date", ["userId", "date"]),
});
